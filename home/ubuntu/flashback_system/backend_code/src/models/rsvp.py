from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class RSVP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    guests = db.Column(db.Integer, default=1)
    selected_dish = db.Column(db.String(200), nullable=False)
    payment_type = db.Column(db.String(20), nullable=False)  # 'individual' ou 'casal'
    total_amount = db.Column(db.Float, nullable=False)
    payment_status = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'rejected'
    payment_proof = db.Column(db.String(500), nullable=True)  # URL ou base64 do comprovante
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)  # Observações do admin
    
    def __repr__(self):
        return f'<RSVP {self.name} - {self.selected_dish}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'guests': self.guests,
            'selected_dish': self.selected_dish,
            'payment_type': self.payment_type,
            'total_amount': self.total_amount,
            'payment_status': self.payment_status,
            'payment_proof': self.payment_proof,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'notes': self.notes
        }

class DishCounter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dish_name = db.Column(db.String(200), unique=True, nullable=False)
    current_count = db.Column(db.Integer, default=0)
    max_count = db.Column(db.Integer, default=7)
    
    def __repr__(self):
        return f'<DishCounter {self.dish_name}: {self.current_count}/{self.max_count}>'
    def to_dict(self):
        return {
            'id': self.id,
            'dish_name': self.dish_name,
            'current_count': self.current_count,
            'max_count': self.max_count,
            'available': self.current_count < self.max_count
        }



