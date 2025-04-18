import os
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from functools import wraps
from config import config
from helpers import save_file, format_date

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///skillswap.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Load configuration
app.config.from_object(config['development'])  # Use 'production' for production environment

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Import models (after db initialization to avoid circular imports)
from models import User, Skill, SkillRequest, Message

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in first', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# Authentication routes
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm = request.form.get('confirm')
        
        # Validation
        if not all([username, email, password, confirm]):
            flash('All fields are required', 'danger')
            return render_template('auth/register.html')
        
        if password != confirm:
            flash('Passwords do not match', 'danger')
            return render_template('auth/register.html')
        
        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered', 'danger')
            return render_template('auth/register.html')
        
        # Create new user
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, email=email, password=hashed_password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            flash('An error occurred. Please try again.', 'danger')
            
    return render_template('auth/register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        # Check password
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'danger')
            
    return render_template('auth/login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

# User profile routes
@app.route('/profile')
@login_required
def profile():
    user = User.query.get(session['user_id'])
    skills_offered = Skill.query.filter_by(user_id=user.id).all()
    return render_template('profile/view.html', user=user, skills=skills_offered)

@app.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    user = User.query.get(session['user_id'])
    
    if request.method == 'POST':
        user.username = request.form.get('username')
        user.bio = request.form.get('bio')
        user.skills_wanted = request.form.get('skills_wanted')
        
        try:
            db.session.commit()
            flash('Profile updated successfully', 'success')
            return redirect(url_for('profile'))
        except:
            db.session.rollback()
            flash('An error occurred', 'danger')
    
    return render_template('profile/edit.html', user=user)

# Dashboard routes
@app.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    skills = Skill.query.filter_by(user_id=user.id).all()
    requests_received = SkillRequest.query.join(Skill).filter(Skill.user_id == user.id).all()
    requests_sent = SkillRequest.query.filter_by(requester_id=user.id).all()
    
    return render_template('dashboard.html', 
                           user=user, 
                           skills=skills, 
                           requests_received=requests_received,
                           requests_sent=requests_sent)

# Skill routes
@app.route('/skills/add', methods=['GET', 'POST'])
@login_required
def add_skill():
    if request.method == 'POST':
        title = request.form.get('title')
        category = request.form.get('category')
        description = request.form.get('description')
        
        if not all([title, category, description]):
            flash('All fields are required', 'danger')
            return render_template('skills/add.html')
        
        new_skill = Skill(
            title=title,
            category=category,
            description=description,
            user_id=session['user_id']
        )
        
        try:
            db.session.add(new_skill)
            db.session.commit()
            flash('Skill added successfully', 'success')
            return redirect(url_for('dashboard'))
        except:
            db.session.rollback()
            flash('An error occurred', 'danger')
    
    return render_template('skills/add.html')

@app.route('/skills/browse')
@login_required
def browse_skills():
    category = request.args.get('category', '')
    search = request.args.get('search', '')
    
    query = Skill.query.filter(Skill.user_id != session['user_id'])
    
    if category:
        query = query.filter_by(category=category)
    
    if search:
        query = query.filter(Skill.title.contains(search) | Skill.description.contains(search))
    
    skills = query.all()
    categories = db.session.query(Skill.category).distinct().all()
    categories = [c[0] for c in categories]
    
    return render_template('skills/browse.html', skills=skills, categories=categories)

@app.route('/skills/<int:skill_id>')
@login_required
def view_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    return render_template('skills/view.html', skill=skill)

@app.route('/skills/request/<int:skill_id>', methods=['POST'])
@login_required
def request_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    
    # Check if already requested
    existing_request = SkillRequest.query.filter_by(
        skill_id=skill_id,
        requester_id=session['user_id']
    ).first()
    
    if existing_request:
        flash('You have already requested this skill', 'warning')
        return redirect(url_for('browse_skills'))
    
    # Create new request
    new_request = SkillRequest(
        skill_id=skill_id,
        requester_id=session['user_id'],
        message=request.form.get('message', ''),
        status='pending'
    )
    
    try:
        db.session.add(new_request)
        db.session.commit()
        flash('Request sent successfully', 'success')
    except:
        db.session.rollback()
        flash('An error occurred', 'danger')
    
    return redirect(url_for('browse_skills'))

@app.route('/skills/requests/manage')
@login_required
def manage_requests():
    # Requests for my skills
    incoming = SkillRequest.query.join(Skill).filter(
        Skill.user_id == session['user_id']
    ).all()
    
    # My requests to others
    outgoing = SkillRequest.query.filter_by(
        requester_id=session['user_id']
    ).all()
    
    return render_template('skills/manage.html', 
                           incoming_requests=incoming, 
                           outgoing_requests=outgoing)

@app.route('/skills/requests/<int:request_id>/update', methods=['POST'])
@login_required
def update_request(request_id):
    req = SkillRequest.query.get_or_404(request_id)
    skill = Skill.query.get(req.skill_id)
    
    # Verify ownership
    if skill.user_id != session['user_id']:
        flash('Unauthorized action', 'danger')
        return redirect(url_for('manage_requests'))
    
    action = request.form.get('action')
    if action == 'accept':
        req.status = 'accepted'
        flash('Request accepted', 'success')
    elif action == 'reject':
        req.status = 'rejected'
        flash('Request rejected', 'success')
    
    try:
        db.session.commit()
    except:
        db.session.rollback()
        flash('An error occurred', 'danger')
    
    return redirect(url_for('manage_requests'))

# Messaging routes
@app.route('/messages')
@login_required
def messages():
    # Get unique conversations
    sent_msgs = Message.query.filter_by(sender_id=session['user_id']).all()
    received_msgs = Message.query.filter_by(receiver_id=session['user_id']).all()
    
    conversations = {}
    
    # Process sent messages
    for msg in sent_msgs:
        if msg.receiver_id not in conversations:
            receiver = User.query.get(msg.receiver_id)
            conversations[msg.receiver_id] = {
                'user': receiver,
                'last_message': msg.content,
                'timestamp': msg.timestamp
            }
        elif msg.timestamp > conversations[msg.receiver_id]['timestamp']:
            conversations[msg.receiver_id]['last_message'] = msg.content
            conversations[msg.receiver_id]['timestamp'] = msg.timestamp
    
    # Process received messages
    for msg in received_msgs:
        if msg.sender_id not in conversations:
            sender = User.query.get(msg.sender_id)
            conversations[msg.sender_id] = {
                'user': sender,
                'last_message': msg.content,
                'timestamp': msg.timestamp
            }
        elif msg.timestamp > conversations[msg.sender_id]['timestamp']:
            conversations[msg.sender_id]['last_message'] = msg.content
            conversations[msg.sender_id]['timestamp'] = msg.timestamp
    
    # Sort by timestamp (newest first)
    sorted_convos = sorted(
        conversations.values(), 
        key=lambda x: x['timestamp'], 
        reverse=True
    )
    
    return render_template('messages/inbox.html', conversations=sorted_convos)

@app.route('/messages/<int:user_id>', methods=['GET', 'POST'])
@login_required
def conversation(user_id):
    other_user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        content = request.form.get('message')
        if content:
            new_message = Message(
                sender_id=session['user_id'],
                receiver_id=user_id,
                content=content
            )
            db.session.add(new_message)
            db.session.commit()
    
    # Get conversation
    messages = Message.query.filter(
        ((Message.sender_id == session['user_id']) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == session['user_id']))
    ).order_by(Message.timestamp).all()
    
    return render_template('messages/conversation.html', 
                           other_user=other_user, 
                           messages=messages)

# AJAX endpoints
@app.route('/api/skills/request/<int:skill_id>', methods=['POST'])
@login_required
def api_request_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    message = request.json.get('message', '')
    
    # Check if already requested
    existing_request = SkillRequest.query.filter_by(
        skill_id=skill_id,
        requester_id=session['user_id']
    ).first()
    
    if existing_request:
        return jsonify({'status': 'error', 'message': 'Already requested'}), 400
    
    # Create new request
    new_request = SkillRequest(
        skill_id=skill_id,
        requester_id=session['user_id'],
        message=message,
        status='pending'
    )
    
    try:
        db.session.add(new_request)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Request sent'}), 200
    except:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': 'Database error'}), 500

@app.route('/api/skills/requests/<int:request_id>', methods=['PUT'])
@login_required
def api_update_request(request_id):
    req = SkillRequest.query.get_or_404(request_id)
    skill = Skill.query.get(req.skill_id)
    
    # Verify ownership
    if skill.user_id != session['user_id']:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    
    status = request.json.get('status')
    if status not in ['accepted', 'rejected']:
        return jsonify({'status': 'error', 'message': 'Invalid status'}), 400
    
    req.status = status
    
    try:
        db.session.commit()
        return jsonify({'status': 'success', 'message': f'Request {status}'}), 200
    except:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': 'Database error'}), 500

# Run the application
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
    app.run(debug=True)