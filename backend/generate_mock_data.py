import sqlite3
import random
import os
from datetime import datetime, timedelta

# PROJECT_ROOT is two levels up from this script (if placed in backend), let's just make it relative to the script execution
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "log_analytics.db")

print(f"Generating SQLite database at: {DB_PATH}")

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1. kpi_daily
c.execute('''
CREATE TABLE IF NOT EXISTS kpi_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt DATE NOT NULL,
    pv INTEGER NOT NULL DEFAULT 0,
    uv INTEGER NOT NULL DEFAULT 0,
    ip_count INTEGER NOT NULL DEFAULT 0,
    sessions INTEGER NOT NULL DEFAULT 0,
    UNIQUE (dt)
)
''')

# 2. kpi_hourly
c.execute('''
CREATE TABLE IF NOT EXISTS kpi_hourly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt DATE NOT NULL,
    hour INTEGER NOT NULL,
    pv INTEGER NOT NULL DEFAULT 0,
    uv INTEGER NOT NULL DEFAULT 0,
    ip_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE (dt, hour)
)
''')

# 3. top_pages
c.execute('''
CREATE TABLE IF NOT EXISTS top_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt DATE NOT NULL,
    page_url TEXT NOT NULL,
    pv INTEGER NOT NULL DEFAULT 0,
    rank_pos INTEGER NOT NULL DEFAULT 0
)
''')

# 4. term_dist
c.execute('''
CREATE TABLE IF NOT EXISTS term_dist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt DATE NOT NULL,
    term_type TEXT NOT NULL,
    pv INTEGER NOT NULL DEFAULT 0,
    UNIQUE (dt, term_type)
)
''')

# 5. browser_dist
c.execute('''
CREATE TABLE IF NOT EXISTS browser_dist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt DATE NOT NULL,
    browser TEXT NOT NULL,
    pv INTEGER NOT NULL DEFAULT 0,
    UNIQUE (dt, browser)
)
''')

# 6. top_search_keywords
c.execute('''
CREATE TABLE IF NOT EXISTS top_search_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt DATE NOT NULL,
    keyword TEXT NOT NULL,
    search_count INTEGER NOT NULL DEFAULT 0,
    rank_pos INTEGER NOT NULL DEFAULT 0
)
''')

# 7. page_bounce_rate
c.execute('''
CREATE TABLE IF NOT EXISTS page_bounce_rate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt DATE NOT NULL,
    url_path TEXT NOT NULL,
    entry_count INTEGER NOT NULL DEFAULT 0,
    bounce_count INTEGER NOT NULL DEFAULT 0,
    bounce_rate REAL NOT NULL DEFAULT 0
)
''')

# 8. user_retention
c.execute('''
CREATE TABLE IF NOT EXISTS user_retention (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dt DATE NOT NULL,
    new_users INTEGER NOT NULL DEFAULT 0,
    retention_1d REAL NOT NULL DEFAULT 0,
    retention_3d REAL NOT NULL DEFAULT 0,
    retention_7d REAL NOT NULL DEFAULT 0,
    UNIQUE (dt)
)
''')

today = datetime.now()

# 清空旧数据
tables = ['kpi_daily', 'kpi_hourly', 'top_pages', 'term_dist', 'browser_dist', 'top_search_keywords', 'page_bounce_rate', 'user_retention']
for t in tables:
    c.execute(f"DELETE FROM {t}")

for i in range(30):
    curr_date = today - timedelta(days=i)
    dt_str = curr_date.strftime("%Y-%m-%d")
    
    # 1. kpi_daily
    pv = random.randint(10000, 50000)
    uv = int(pv * random.uniform(0.3, 0.6))
    ip_count = int(uv * random.uniform(0.8, 0.95))
    sessions = int(uv * random.uniform(1.1, 1.5))
    
    c.execute("INSERT INTO kpi_daily (dt, pv, uv, ip_count, sessions) VALUES (?, ?, ?, ?, ?)",
              (dt_str, pv, uv, ip_count, sessions))
              
    # 2. kpi_hourly
    for h in range(24):
        h_pv = int(pv / 24 * random.uniform(0.5, 1.5))
        h_uv = int(h_pv * random.uniform(0.3, 0.6))
        h_ip = int(h_uv * random.uniform(0.8, 0.95))
        c.execute("INSERT INTO kpi_hourly (dt, hour, pv, uv, ip_count) VALUES (?, ?, ?, ?, ?)",
                  (dt_str, h, h_pv, h_uv, h_ip))
                  
    # 3. top_pages
    pages = ["/home", "/download", "/about", "/products", "/contact", "/pricing", "/blog", "/login", "/register", "/dashboard"]
    pages_sample = random.sample(pages, 10)
    for rank, p in enumerate(pages_sample, 1):
        p_pv = int(pv * random.uniform(0.01, 0.2))
        c.execute("INSERT INTO top_pages (dt, page_url, pv, rank_pos) VALUES (?, ?, ?, ?)",
                  (dt_str, p, p_pv, rank))
                  
    # 4. term_dist
    c.execute("INSERT INTO term_dist (dt, term_type, pv) VALUES (?, ?, ?)", (dt_str, "PC", int(pv * 0.6)))
    c.execute("INSERT INTO term_dist (dt, term_type, pv) VALUES (?, ?, ?)", (dt_str, "Mobile", int(pv * 0.35)))
    c.execute("INSERT INTO term_dist (dt, term_type, pv) VALUES (?, ?, ?)", (dt_str, "Tablet", int(pv * 0.05)))
    
    # 5. browser_dist
    c.execute("INSERT INTO browser_dist (dt, browser, pv) VALUES (?, ?, ?)", (dt_str, "Chrome", int(pv * 0.65)))
    c.execute("INSERT INTO browser_dist (dt, browser, pv) VALUES (?, ?, ?)", (dt_str, "Safari", int(pv * 0.2)))
    c.execute("INSERT INTO browser_dist (dt, browser, pv) VALUES (?, ?, ?)", (dt_str, "Edge", int(pv * 0.1)))
    c.execute("INSERT INTO browser_dist (dt, browser, pv) VALUES (?, ?, ?)", (dt_str, "Firefox", int(pv * 0.05)))
    
    # 6. top_search_keywords
    keywords = ["big data", "hadoop", "spark", "kubernetes", "docker", "log analysis", "AI", "machine learning", "machine", "cloud"]
    k_sample = random.sample(keywords, 10)
    for rank, k in enumerate(k_sample, 1):
        k_count = random.randint(100, 1000)
        c.execute("INSERT INTO top_search_keywords (dt, keyword, search_count, rank_pos) VALUES (?, ?, ?, ?)",
                  (dt_str, k, k_count, rank))
                  
    # 7. page_bounce_rate
    for rank, p in enumerate(pages_sample, 1):
        entry = random.randint(1000, 5000)
        bounce = int(entry * random.uniform(0.2, 0.8))
        rate = round((bounce / entry) * 100, 2)
        c.execute("INSERT INTO page_bounce_rate (dt, url_path, entry_count, bounce_count, bounce_rate) VALUES (?, ?, ?, ?, ?)",
                  (dt_str, p, entry, bounce, rate))
                  
    # 8. user_retention
    new_u = random.randint(500, 2000)
    ret_1d = round(random.uniform(30.0, 50.0), 2)
    ret_3d = round(random.uniform(20.0, 30.0), 2)
    ret_7d = round(random.uniform(10.0, 20.0), 2)
    c.execute("INSERT INTO user_retention (dt, new_users, retention_1d, retention_3d, retention_7d) VALUES (?, ?, ?, ?, ?)",
              (dt_str, new_u, ret_1d, ret_3d, ret_7d))

conn.commit()
conn.close()

print("Mock data generated successfully in SQLite.")
