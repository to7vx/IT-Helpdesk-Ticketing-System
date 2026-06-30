"""
Seed script — generates realistic data for the IT Helpdesk system.
Run from the backend/ directory:  python seed.py
"""
import random
import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from faker import Faker
from app.database import SessionLocal, engine, Base
import app.models  # register all models
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.sla_rule import SLARule, Priority
from app.models.ticket import Ticket, TicketStatus
from app.models.comment import Comment, CommentType
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
fake = Faker()
db = SessionLocal()

print("Seeding database...")

# ── Categories ────────────────────────────────────────────────────────────────
CATEGORIES = [
    ("Hardware", "Physical device issues", 48.0),
    ("Software", "Application and OS issues", 24.0),
    ("Network", "Connectivity and network access", 8.0),
    ("Access & Permissions", "Account access and permission requests", 12.0),
    ("Email", "Email client and mail server issues", 16.0),
    ("Security", "Security incidents and policy questions", 4.0),
    ("Printer", "Printer and peripheral issues", 24.0),
    ("Other", "Miscellaneous requests", 48.0),
]
categories = []
for name, desc, sla in CATEGORIES:
    cat = db.query(Category).filter(Category.name == name).first()
    if not cat:
        cat = Category(name=name, description=desc, default_sla_hours=sla)
        db.add(cat)
    categories.append(cat)
db.commit()
print(f"  {len(categories)} categories ready")

# ── SLA Rules ─────────────────────────────────────────────────────────────────
SLA_HOURS = {Priority.low: 72.0, Priority.medium: 24.0, Priority.high: 8.0, Priority.urgent: 2.0}
for priority, hours in SLA_HOURS.items():
    rule = db.query(SLARule).filter(SLARule.priority == priority).first()
    if not rule:
        db.add(SLARule(priority=priority, resolution_hours=hours))
db.commit()
print("  SLA rules ready")

# ── Admin ─────────────────────────────────────────────────────────────────────
admin = db.query(User).filter(User.email == "admin@helpdesk.local").first()
if not admin:
    admin = User(name="Admin User", email="admin@helpdesk.local", password_hash=hash_password("Admin1234!"), role=UserRole.admin)
    db.add(admin)
    db.commit()
    db.refresh(admin)
print(f"  Admin: admin@helpdesk.local / Admin1234!")

# ── Agents ────────────────────────────────────────────────────────────────────
AGENT_COUNT = 5
agents = db.query(User).filter(User.role == UserRole.agent).all()
while len(agents) < AGENT_COUNT:
    a = User(
        name=fake.name(),
        email=fake.unique.email(),
        password_hash=hash_password("Agent1234!"),
        role=UserRole.agent,
    )
    db.add(a)
    db.flush()
    agents.append(a)
db.commit()
print(f"  {len(agents)} agents ready (password: Agent1234!)")

# ── End Users ─────────────────────────────────────────────────────────────────
USER_COUNT = 20
users_list = db.query(User).filter(User.role == UserRole.end_user).all()
while len(users_list) < USER_COUNT:
    u = User(
        name=fake.name(),
        email=fake.unique.email(),
        password_hash=hash_password("User1234!"),
        role=UserRole.end_user,
    )
    db.add(u)
    db.flush()
    users_list.append(u)
db.commit()

# also create a known demo user
demo_user = db.query(User).filter(User.email == "user@helpdesk.local").first()
if not demo_user:
    demo_user = User(name="Demo User", email="user@helpdesk.local", password_hash=hash_password("User1234!"), role=UserRole.end_user)
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
users_list.append(demo_user)
print(f"  {len(users_list)} end users ready")
print(f"  Demo user: user@helpdesk.local / User1234!")

# ── Demo agent ────────────────────────────────────────────────────────────────
demo_agent = db.query(User).filter(User.email == "agent@helpdesk.local").first()
if not demo_agent:
    demo_agent = User(name="Demo Agent", email="agent@helpdesk.local", password_hash=hash_password("Agent1234!"), role=UserRole.agent)
    db.add(demo_agent)
    db.commit()
    db.refresh(demo_agent)
    agents.append(demo_agent)
print(f"  Demo agent: agent@helpdesk.local / Agent1234!")

# ── Tickets ───────────────────────────────────────────────────────────────────
TICKET_TEMPLATES = [
    ("Cannot login to VPN", "I am unable to connect to the VPN from home. Error: authentication failed."),
    ("Laptop screen flickering", "My laptop screen has been flickering intermittently since yesterday."),
    ("Outlook not syncing emails", "My Outlook inbox hasn't updated since this morning."),
    ("Request for software license", "I need a license for Adobe Acrobat for my new project."),
    ("Slow internet connection", "The network is extremely slow in conference room B."),
    ("Password reset needed", "I got locked out after multiple failed login attempts."),
    ("Printer not working", "The printer on floor 3 is showing an offline error."),
    ("Malware suspected", "I accidentally clicked a suspicious link and now my browser is redirecting."),
    ("New employee setup", "Please set up an account and laptop for our new hire starting Monday."),
    ("Microsoft Teams crashing", "Teams crashes every time I try to join a meeting."),
    ("Data backup failure", "The nightly backup job failed with error code E0012."),
    ("Monitor not detected", "My second monitor stopped being detected after a Windows update."),
    ("Email spam issue", "I'm receiving hundreds of spam emails per hour."),
    ("Software installation request", "Need Python 3.11 installed on my workstation."),
    ("Cannot access shared drive", "I lost access to the \\\\server\\shared drive after my role change."),
    ("System running slowly", "My computer has been extremely slow for the past week."),
    ("Video conferencing audio issue", "Other participants can't hear me during Zoom calls."),
    ("Two-factor auth setup", "I need help setting up 2FA on my work account."),
    ("File recovery request", "I accidentally deleted an important folder from my desktop."),
    ("Remote desktop connection failed", "RDP to my office machine times out consistently."),
]

STATUSES = [TicketStatus.open, TicketStatus.in_progress, TicketStatus.resolved, TicketStatus.closed]
STATUS_WEIGHTS = [0.25, 0.30, 0.30, 0.15]
PRIORITIES = [Priority.low, Priority.medium, Priority.high, Priority.urgent]
PRIORITY_WEIGHTS = [0.20, 0.40, 0.30, 0.10]

existing_tickets = db.query(Ticket).count()
tickets_to_create = max(0, 300 - existing_tickets)
print(f"  Creating {tickets_to_create} tickets...")

for i in range(tickets_to_create):
    template = random.choice(TICKET_TEMPLATES)
    priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
    status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
    category = random.choice(categories)
    creator = random.choice(users_list)
    agent = random.choice(agents) if status != TicketStatus.open else (random.choice(agents) if random.random() > 0.4 else None)

    days_ago = random.randint(0, 90)
    created_at = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23))

    sla_hours = SLA_HOURS[priority]
    sla_due = created_at + timedelta(hours=sla_hours)

    resolved_at = None
    if status in (TicketStatus.resolved, TicketStatus.closed):
        resolve_hours = random.uniform(1, sla_hours * 1.5)
        resolved_at = created_at + timedelta(hours=resolve_hours)

    ticket = Ticket(
        title=template[0],
        description=template[1] + " " + fake.sentence(),
        category_id=category.id,
        priority=priority,
        status=status,
        created_by_id=creator.id,
        assigned_to_id=agent.id if agent else None,
        created_at=created_at,
        updated_at=created_at + timedelta(hours=random.randint(0, 5)),
        resolved_at=resolved_at,
        sla_due_at=sla_due,
    )
    db.add(ticket)
    db.flush()

    # Activity log
    db.add(Comment(ticket_id=ticket.id, author_id=creator.id, content="Ticket created.", comment_type=CommentType.system, created_at=created_at))

    if agent:
        db.add(Comment(
            ticket_id=ticket.id, author_id=admin.id,
            content=f"Ticket assigned to {agent.name}.",
            comment_type=CommentType.assignment_change,
            created_at=created_at + timedelta(minutes=30),
        ))

    if status != TicketStatus.open:
        db.add(Comment(
            ticket_id=ticket.id, author_id=agent.id if agent else admin.id,
            content="We are looking into this issue for you.",
            comment_type=CommentType.public_reply,
            created_at=created_at + timedelta(hours=1),
        ))

    if status in (TicketStatus.resolved, TicketStatus.closed) and resolved_at:
        db.add(Comment(
            ticket_id=ticket.id, author_id=agent.id if agent else admin.id,
            content="This issue has been resolved. Please let us know if you need further assistance.",
            comment_type=CommentType.public_reply,
            created_at=resolved_at,
        ))
        db.add(Comment(
            ticket_id=ticket.id, author_id=agent.id if agent else admin.id,
            content=f"Status changed to {status.value}.",
            comment_type=CommentType.status_change,
            created_at=resolved_at,
        ))

db.commit()
print(f"  Done. Total tickets: {db.query(Ticket).count()}")

print("\nSeed complete!")
print("─" * 40)
print("Login credentials:")
print("  Admin  : admin@helpdesk.local  /  Admin1234!")
print("  Agent  : agent@helpdesk.local  /  Agent1234!")
print("  User   : user@helpdesk.local   /  User1234!")
