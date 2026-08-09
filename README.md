# Smart Last-Mile Delivery (FYP)

End-to-end stack matching the project PPT:

1. **Data input** — React Deliveries page → Node/Mongo  
2. **Demand prediction** — XGBoost models via Flask `/predict/*`  
3. **MOVRP optimization** — NSGA-II (DEAP) via Flask `/optimize`  
4. **Visualization** — Dashboard Pareto front, route map, workload  

## Architecture

```
Frontend (:5173) → Node API (:3000) → Flask optimizer+ML (:5000)
                         ↓
                   MongoDB Atlas
```

## Quick start

### 1. Python optimizer + ML (port 5000)

```bash
cd MV_Final
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 2. Node backend (port 3000)

```bash
cd Backend
npm install
npm run dev
```

### 3. React frontend (port 5173)

```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:5173 → sign up / log in → **Deliveries** → add vehicles + stops → **Run optimization** → **Dashboard**.

## API flow

`POST /api/optimize/run`

1. Loads queued/pending deliveries + vehicles from Mongo  
2. Calls Flask `POST /predict/batch` (ML demand + ETA)  
3. Calls Flask `POST /optimize` (NSGA-II)  
4. Saves Pareto solutions to `optimization` collection  
5. Marks deliveries `Completed`  

## Env (`Backend/.env`)

- `MONGO_URI` — MongoDB connection  
- `JWT_SECRET` — auth  
- `OPTIMIZER_URL` — default `http://localhost:5000`  
- `DEPOT_LAT` / `DEPOT_LNG` — default Prayagraj depot  
