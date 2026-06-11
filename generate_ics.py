import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import pytz
import hashlib

URL = "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7"
TEAM_NAME = "1. FC Lok Leipzig"
TZ = pytz.timezone("Europe/Berlin")

def clean(text):
    return text.replace("\n", "").strip()

def fetch_games():
    r = requests.get(URL)
    soup = BeautifulSoup(r.text, "html.parser")
    games = []

    for m in soup.select(".match"):
        try:
            date = clean(m.select_one(".date").text)
            time = clean(m.select_one(".time").text)

            home = clean(m.select_one(".team-home").text)
            away = clean(m.select_one(".team-away").text)

            league = clean(m.select_one(".competition").text)
            location = clean(m.select_one(".location").text)

            dt = datetime.strptime(f"{date} {time}", "%d.%m.%Y %H:%M")

            if TEAM_NAME.lower() in home.lower():
                summary = f"⚽ Heim: {home} vs {away}"
            else:
                summary = f"✈️ Auswärts: {home} vs {away}"

            description = f"{league}\\n{home} vs {away}"

            uid_raw = f"{date}-{time}-{home}-{away}"
            uid = hashlib.md5(uid_raw.encode()).hexdigest()

            games.append({
                "uid": uid,
                "start": dt,
                "end": dt + timedelta(hours=2),
                "summary": summary,
                "location": location,
                "description": description
            })

        except:
            continue

    return games

def create_ics(games):
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Lok Leipzig//Spielplan//DE",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ]

    now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    for g in games:
        start = TZ.localize(g["start"]).strftime("%Y%m%dT%H%M%S")
        end = TZ.localize(g["end"]).strftime("%Y%m%dT%H%M%S")

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{g['uid']}",
            f"DTSTAMP:{now}",
            f"DTSTART;TZID=Europe/Berlin:{start}",
            f"DTEND;TZID=Europe/Berlin:{end}",
            f"SUMMARY:{g['summary']}",
            f"DESCRIPTION:{g['description']}",
            f"LOCATION:{g['location']}",
            "STATUS:CONFIRMED",
            "END:VEVENT"
        ])

    lines.append("END:VCALENDAR")
    return "\\n".join(lines)

if __name__ == "__main__":
    games = fetch_games()
    ics = create_ics(games)

    with open("spiele.ics", "w", encoding="utf-8") as f:
        f.write(ics)

    print(f"{len(games)} Spiele exportiert")
