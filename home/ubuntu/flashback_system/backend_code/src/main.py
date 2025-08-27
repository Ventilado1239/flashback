import os
import sys
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from models.rsvp import db
from routes_rsvp import rsvp_bp

# -------------------------------------------------
# .env (local) e variáveis de ambiente (Render)
# -------------------------------------------------
load_dotenv()

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'flashback-festa-anos-60-90-secret-key')

# -------------------------------------------------
# CORS – em produção, troque "*" pela URL da Vercel
# Ex.: CORS(app, resources={r"/api/*": {"origins": ["https://seu-front.vercel.app"]}})
# -------------------------------------------------
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Blueprints
app.register_blueprint(rsvp_bp, url_prefix='/api')

# -------------------------------------------------
# Banco de dados: usa DATABASE_URL (Neon/Postgres)
# Se não existir, cai no SQLite local (dev)
# -------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL:
    # Ex.: postgresql://user:pass@host/db?sslmode=require&channel_binding=require
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
else:
    database_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
    os.makedirs(os.path.dirname(database_path), exist_ok=True)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{database_path}"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    'pool_timeout': 20,
    'pool_recycle': -1,
    'pool_pre_ping': True
}

# Inicializa ORM e cria tabelas (primeira execução)
db.init_app(app)
with app.app_context():
    db.create_all()

# -------------------------------------------------
# Rotas simples (index/admin já existiam)
# -------------------------------------------------
@app.route("/")
def serve_index():
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception:
        return jsonify({"message": "Backend Flask funcionando! Acesse /admin para o painel administrativo."})

@app.route("/admin")
def admin_panel():
    """Painel administrativo completo"""
    return """
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Painel Administrativo - Flashback</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
            .stat-card { background: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 2em; font-weight: bold; }
            .stat-label { font-size: 0.9em; opacity: 0.9; }
            .dishes-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 30px; }
            .dish-card { padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
            .dish-available { background: #d4edda; border-color: #c3e6cb; }
            .dish-full { background: #f8d7da; border-color: #f5c6cb; }
            .dish-name { font-weight: bold; margin-bottom: 5px; }
            .dish-count { font-size: 0.9em; color: #666; }
            .rsvp-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .rsvp-table th, .rsvp-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            .rsvp-table th { background: #f8f9fa; }
            .btn { padding: 5px 10px; margin: 2px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
            .btn-success { background: #28a745; color: white; }
            .btn-danger { background: #dc3545; color: white; }
            .btn-warning { background: #ffc107; color: black; }
            .btn-primary { background: #007bff; color: white; }
            .status-pending { color: #ffc107; font-weight: bold; }
            .status-confirmed { color: #28a745; font-weight: bold; }
            .status-rejected { color: #dc3545; font-weight: bold; }
            .refresh-btn { background: #17a2b8; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Painel Administrativo - Festa Flashback</h1>
                <button class="refresh-btn" onclick="loadData()">🔄 Atualizar Dados</button>
            </div>
            
            <div class="stats" id="stats">
                <div class="stat-card">
                    <div class="stat-number" id="total-rsvps">0</div>
                    <div class="stat-label">Total RSVPs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="total-guests">0</div>
                    <div class="stat-label">Total Convidados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="confirmed-payments">0</div>
                    <div class="stat-label">Pagamentos Confirmados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="total-revenue">R$ 0.00</div>
                    <div class="stat-label">Receita Confirmada</div>
                </div>
            </div>
            
            <h2>📊 Status dos Pratos</h2>
            <div class="dishes-grid" id="dishes-grid"></div>
            
            <h2>📝 Lista de RSVPs</h2>
            <table class="rsvp-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Convidados</th>
                        <th>Prato</th>
                        <th>Valor</th>
                        <th>Status Pagamento</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="rsvp-list"></tbody>
            </table>
        </div>
        
        <script>
            async function loadData() {
                try {
                    const statsResponse = await fetch('/api/stats');
                    const statsData = await statsResponse.json();
                    if (statsData.success) {
                        document.getElementById('total-rsvps').textContent = statsData.data.total_rsvps;
                        document.getElementById('total-guests').textContent = statsData.data.total_guests;
                        document.getElementById('confirmed-payments').textContent = statsData.data.confirmed_payments;
                        document.getElementById('total-revenue').textContent = `R$ ${statsData.data.total_revenue.toFixed(2)}`;
                    }
                    const dishesResponse = await fetch('/api/dishes');
                    const dishesData = await dishesResponse.json();
                    if (dishesData.success) {
                        const dishesGrid = document.getElementById('dishes-grid');
                        dishesGrid.innerHTML = '';
                        dishesData.data.forEach(dish => {
                            const dishCard = document.createElement('div');
                            dishCard.className = `dish-card ${dish.available ? 'dish-available' : 'dish-full'}`;
                            dishCard.innerHTML = `
                                <div class="dish-name">${dish.dish_name}</div>
                                <div class="dish-count">${dish.current_count}/${dish.max_count} ${dish.available ? '✅' : '❌'}</div>
                            `;
                            dishesGrid.appendChild(dishCard);
                        });
                    }
                    const rsvpsResponse = await fetch('/api/rsvps');
                    const rsvpsData = await rsvpsResponse.json();
                    if (rsvpsData.success) {
                        const rsvpList = document.getElementById('rsvp-list');
                        rsvpList.innerHTML = '';
                        rsvpsData.data.forEach(rsvp => {
                            const row = document.createElement('tr');
                            const statusClass = `status-${rsvp.payment_status}`;
                            const statusText = rsvp.payment_status === 'pending' ? 'Pendente' :
                                             rsvp.payment_status === 'confirmed' ? 'Confirmado' : 'Recusado';
                            row.innerHTML = `
                                <td>${rsvp.name}</td>
                                <td>${rsvp.email}</td>
                                <td>${rsvp.guests}</td>
                                <td>${rsvp.selected_dish}</td>
                                <td>R$ ${rsvp.total_amount.toFixed(2)}</td>
                                <td class="${statusClass}">${statusText}</td>
                                <td>${new Date(rsvp.created_at).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    ${rsvp.payment_status === 'pending' ? `
                                        <button class="btn btn-success" onclick="acceptRsvp(${rsvp.id})">✅ Aceitar</button>
                                        <button class="btn btn-danger" onclick="rejectRsvp(${rsvp.id})">❌ Recusar</button>
                                    ` : ''}
                                    <button class="btn btn-warning" onclick="deleteRsvp(${rsvp.id})">🗑️ Excluir</button>
                                </td>
                            `;
                            rsvpList.appendChild(row);
                        });
                    }
                } catch (error) {
                    console.error('Erro ao carregar dados:', error);
                    alert('Erro ao carregar dados. Verifique a conexão.');
                }
            }
            async function acceptRsvp(id) {
                try {
                    const response = await fetch(`/api/rsvps/${id}/accept`, { method: 'POST' });
                    const data = await response.json();
                    if (data.success) { alert('RSVP aceito com sucesso!'); loadData(); }
                    else { alert('Erro: ' + data.error); }
                } catch (error) { alert('Erro ao aceitar RSVP'); }
            }
            async function rejectRsvp(id) {
                try {
                    const response = await fetch(`/api/rsvps/${id}/reject`, { method: 'POST' });
                    const data = await response.json();
                    if (data.success) { alert('RSVP recusado!'); loadData(); }
                    else { alert('Erro: ' + data.error); }
                } catch (error) { alert('Erro ao recusar RSVP'); }
            }
            async function deleteRsvp(id) {
                if (confirm('Tem certeza que deseja excluir este RSVP?')) {
                    try {
                        const response = await fetch(`/api/rsvps/${id}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (data.success) { alert('RSVP excluído com sucesso!'); loadData(); }
                        else { alert('Erro: ' + data.error); }
                    } catch (error) { alert('Erro ao excluir RSVP'); }
                }
            }
            loadData();
            setInterval(loadData, 30000);
        </script>
    </body>
    </html>
    """

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()

if __name__ == "__main__":
    # Em produção (Render) use: gunicorn main:app
    app.run(host="0.0.0.0", port=5000, debug=True)
