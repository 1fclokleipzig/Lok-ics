import requests
import re
from datetime import datetime, timedelta
import pytz
import hashlib

URL = "https://www.fussball.de/ajax.team.next.games/-/mode/PAGE/team-id/011MIAFLAK000000VTVG0001VTR8C1K7"
TZ = pytz.timezone("Europe/Berlin")


def fetch_games():
    r = requests.get(URL)
    text = r.text

    games = []

    # sucht Datum + Uhrzeit + Teams
    pattern = re.findall(r'(\d{2}\.\d{2}\.\d{4}).*?(\d{2}:\d{2}).*?team-name.*?>(.*?)<.*?team-name.*?>(.*?)<', text, re.DOTALL)

    for match in pattern:
        try:
            date, time, home, away = match

            dt = datetime.strptime(f"{date} {time}", "%d.%m.%Y %H:%M")

            teams = f"{home.strip()} vs {away.strip()}"

            uid_raw = f"{date}-{time}-{teams}"
            uid = hashlib.md5(uid_raw.encode()).hexdigest()

            games.append({
                "uid": uid,
                "start": dt,
                "end": dt + timedelta(hours=2),
                "summary": f"⚽ {teams}",
                "location": "",
                "description": "Spielplan"
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
    return "\n".join(lines)


if __name__ == "__main__":
    games = fetch_games()
    print("Gefundene Spiele:", len(games))

    with open("spiele.ics", "w", encoding="utf-8") as f:
        f.write(create_ics(games))
