# TPS-Toko-Jam
Proyek Transaction Processing System Toko Jam Online

# How to run backend
cd backend
copy .env.example .env
py -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# How to run frontend