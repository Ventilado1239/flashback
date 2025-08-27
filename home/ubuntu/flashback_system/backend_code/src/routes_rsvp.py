from flask import Blueprint, request, jsonify
from models.rsvp import db, RSVP, DishCounter
from datetime import datetime

rsvp_bp = Blueprint("rsvp", __name__)

# Lista de pratos disponíveis
AVAILABLE_DISHES = [
    "Almôndegas com mandioca",
    "Torresmo", 
    "Calabresa frita",
    "Batata frita",
    "Carne de sol frita",
    "Caldos",
    "Pastéis",
    "Churrasquinho",
    "Frango a passarinho",
    "Linguiça acebolada",
    "Cachorro quente",
    "Mandioca frita",
    "Frios (mussarela, presunto, mortadela, ovos de codorna, azeitona, salsicha, palmito, salaminho)",
    "Bolinho de arroz",
    "Bolinho de bacalhau",
    "Camarão",
    "Tilápia frita",
    "Kibe"
]

@rsvp_bp.route("/rsvps", methods=["GET"])
def get_all_rsvps():
    """Listar todos os RSVPs"""
    try:
        rsvps = RSVP.query.order_by(RSVP.created_at.desc()).all()
        return jsonify({
            "success": True,
            "data": [rsvp.to_dict() for rsvp in rsvps],
            "total": len(rsvps)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@rsvp_bp.route("/rsvps", methods=["POST"])
def create_rsvp():
    """Criar novo RSVP (do formulário do site ou admin)"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ["name", "email", "selected_dish", "payment_type"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"success": False, "error": f"Campo {field} é obrigatório"}), 400
        
        # Verificar se o prato ainda está disponível
        dish_counter = DishCounter.query.filter_by(dish_name=data["selected_dish"]).first()
        if not dish_counter:
            # Criar contador se não existir
            dish_counter = DishCounter(dish_name=data["selected_dish"], current_count=0, max_count=7)
            db.session.add(dish_counter)
        
        if dish_counter.current_count >= dish_counter.max_count:
            return jsonify({"success": False, "error": "Prato não disponível (limite atingido)"}), 400
        
        # Calcular valor total
        guests = data.get("guests", 1)
        if data["payment_type"] == "individual":
            total_amount = guests * 60.0
        else:  # casal
            total_amount = 100.0
        
        # Criar RSVP
        rsvp = RSVP(
            name=data["name"],
            email=data["email"],
            phone=data.get("phone", ""),
            guests=guests,
            selected_dish=data["selected_dish"],
            payment_type=data["payment_type"],
            total_amount=total_amount,
            payment_proof=data.get("payment_proof", ""),
            notes=data.get("notes", "")
        )
        
        db.session.add(rsvp)
        
        # Atualizar contador do prato
        dish_counter.current_count += 1
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": rsvp.to_dict(),
            "message": "RSVP criado com sucesso!"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@rsvp_bp.route("/rsvps/<int:rsvp_id>", methods=["PUT"])
def update_rsvp(rsvp_id):
    """Atualizar RSVP (admin)"""
    try:
        rsvp = RSVP.query.get_or_404(rsvp_id)
        data = request.get_json()
        
        old_dish = rsvp.selected_dish
        new_dish = data.get("selected_dish", old_dish)
        
        # Se mudou o prato, atualizar contadores
        if old_dish != new_dish:
            # Decrementar contador do prato antigo
            old_counter = DishCounter.query.filter_by(dish_name=old_dish).first()
            if old_counter and old_counter.current_count > 0:
                old_counter.current_count -= 1
            
            # Incrementar contador do prato novo
            new_counter = DishCounter.query.filter_by(dish_name=new_dish).first()
            if not new_counter:
                new_counter = DishCounter(dish_name=new_dish, current_count=0, max_count=7)
                db.session.add(new_counter)
            
            if new_counter.current_count >= new_counter.max_count:
                return jsonify({"success": False, "error": "Prato não disponível (limite atingido)"}), 400
            
            new_counter.current_count += 1
        
        # Atualizar campos
        rsvp.name = data.get("name", rsvp.name)
        rsvp.email = data.get("email", rsvp.email)
        rsvp.phone = data.get("phone", rsvp.phone)
        rsvp.guests = data.get("guests", rsvp.guests)
        rsvp.selected_dish = new_dish
        rsvp.payment_type = data.get("payment_type", rsvp.payment_type)
        rsvp.payment_status = data.get("payment_status", rsvp.payment_status)
        rsvp.payment_proof = data.get("payment_proof", rsvp.payment_proof)
        rsvp.notes = data.get("notes", rsvp.notes)
        rsvp.updated_at = datetime.utcnow()
        
        # Recalcular valor se necessário
        if data.get("payment_type") or data.get("guests"):
            if rsvp.payment_type == "individual":
                rsvp.total_amount = rsvp.guests * 60.0
            else:
                rsvp.total_amount = 100.0
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": rsvp.to_dict(),
            "message": "RSVP atualizado com sucesso!"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@rsvp_bp.route("/rsvps/<int:rsvp_id>", methods=["DELETE"])
def delete_rsvp(rsvp_id):
    """Deletar RSVP (admin)"""
    try:
        rsvp = RSVP.query.get_or_404(rsvp_id)
        
        # Decrementar contador do prato
        dish_counter = DishCounter.query.filter_by(dish_name=rsvp.selected_dish).first()
        if dish_counter and dish_counter.current_count > 0:
            dish_counter.current_count -= 1
        
        db.session.delete(rsvp)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "RSVP removido com sucesso!"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@rsvp_bp.route('/dishes', methods=['GET'])
def get_dish_status():
    """Obter status de todos os pratos"""
    try:
        # Inicializar contadores se não existirem
        for dish in AVAILABLE_DISHES:
            counter = DishCounter.query.filter_by(dish_name=dish).first()
            if not counter:
                counter = DishCounter(dish_name=dish, current_count=0, max_count=7)
                db.session.add(counter)
        
        db.session.commit()
        
        # Buscar todos os contadores
        counters = DishCounter.query.all()
        
        return jsonify({
            'success': True,
            'data': [counter.to_dict() for counter in counters]
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@rsvp_bp.route("/stats", methods=["GET"])
def get_stats():
    try:
        total_rsvps = RSVP.query.count()
        confirmed_payments = RSVP.query.filter_by(payment_status='confirmed').count()
        pending_payments = RSVP.query.filter_by(payment_status='pending').count()
        total_guests = db.session.query(db.func.sum(RSVP.guests)).scalar() or 0
        total_revenue = db.session.query(db.func.sum(RSVP.total_amount)).filter_by(payment_status='confirmed').scalar() or 0
        # Pratos mais populares
        dish_stats = db.session.query(
            RSVP.selected_dish,
            db.func.count(RSVP.id).label("count")
        ).group_by(RSVP.selected_dish).order_by(db.func.count(RSVP.id).desc()).all()
        
        return jsonify({
            'success': True,
            'data': {
                'total_rsvps': total_rsvps,
                'confirmed_payments': confirmed_payments,
                'pending_payments': pending_payments,
                'total_guests': total_guests,
                'total_revenue': total_revenue,
                'dish_stats': [{'dish': dish, 'count': count} for dish, count in dish_stats]
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@rsvp_bp.route("/init", methods=["POST"])
def initialize_dishes():
    """Inicializar contadores de pratos""" 
    try:
        for dish in AVAILABLE_DISHES:
            counter = DishCounter.query.filter_by(dish_name=dish).first()
            if not counter:
                counter = DishCounter(dish_name=dish, current_count=0, max_count=7)
                db.session.add(counter)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Contadores de pratos inicializados!'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500





@rsvp_bp.route("/rsvps/<int:rsvp_id>/accept", methods=["POST"])
def accept_rsvp(rsvp_id):
    """Aceitar RSVP (admin)"""
    try:
        rsvp = RSVP.query.get_or_404(rsvp_id)
        rsvp.payment_status = "confirmed"
        rsvp.updated_at = datetime.utcnow()
        
        # Atualizar contadores de pratos e estatísticas
        dish_counter = DishCounter.query.filter_by(dish_name=rsvp.selected_dish).first()
        if dish_counter:
            # Aumentar o contador apenas se o RSVP não estava confirmado antes
            if rsvp.payment_status != "confirmed":
                dish_counter.current_count += 1
            db.session.add(dish_counter)

        db.session.add(rsvp)
        db.session.commit()
        db.session.refresh(rsvp)
        
        return jsonify({
            "success": True,
            "data": rsvp.to_dict(),
            "message": "RSVP aceito com sucesso!"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@rsvp_bp.route("/rsvps/<int:rsvp_id>/reject", methods=["POST"])
def reject_rsvp(rsvp_id):
    """Recusar RSVP (admin)"""
    try:
        rsvp = RSVP.query.get_or_404(rsvp_id)
        
        # Se o RSVP estava confirmado, decrementar o contador do prato
        if rsvp.payment_status == "confirmed":
            dish_counter = DishCounter.query.filter_by(dish_name=rsvp.selected_dish).first()
            if dish_counter and dish_counter.current_count > 0:
                dish_counter.current_count -= 1
            db.session.add(dish_counter)

        rsvp.payment_status = "rejected"
        rsvp.updated_at = datetime.utcnow()
        
        db.session.add(rsvp)
        db.session.commit()
        db.session.refresh(rsvp)
        
        return jsonify({
            "success": True,
            "data": rsvp.to_dict(),
            "message": "RSVP recusado!"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

