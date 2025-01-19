from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from howlongtobeatpy import HowLongToBeat
from steam_web_api import Steam
import urllib.parse

app = Flask(__name__)
KEY = "7EB23E0E6CF306CF2276F659CCAED6FF"
steam = Steam(KEY)
# CORS setup
allowed_origins = ['http://localhost:3000']

def cors_options(origin):
    if origin in allowed_origins or origin is None:
        return True
    return False

CORS(app, origins=allowed_origins)

@app.route('/api/steam', methods=['GET'])
async def get_steam_games():
    try:
        steamId = request.args.get('steamid')
        page = int(request.args.get('page', 1))
        page_size = 20
        include_most_played = request.args.get('mostPlayed')
        max_time = int(request.args.get('maxTime'))

        if not steamId:
            return jsonify({'error': 'Missing required query parameters: Steam ID'}), 400

        games = steam.users.get_owned_games(steamId)
        if not games or 'games' not in games:
            return jsonify({'error': 'No games found for this Steam ID'}), 404

        all_games = games['games']
        not_played_games = (
    list(filter(lambda g: g['playtime_forever'] < max_time, all_games))
    if include_most_played.lower() != 'true' else all_games
)
        total_games = len(not_played_games)
        start_index, end_index = (page - 1) * page_size, (page - 1) * page_size + page_size

        if start_index >= total_games:
            return jsonify({'error': 'Page out of range'}), 404

        paginated_games = not_played_games[start_index:end_index]

        for game in paginated_games:
            appid = game['appid']
            try:
                app_details = steam.apps.get_app_details(int(appid), "US", "metacritic")
                game['metacritic'] = app_details[str(appid)]['data']['metacritic']['score'] if (
                    app_details and str(appid) in app_details and 'data' in app_details[str(appid)] and 'metacritic' in app_details[str(appid)]['data']
                ) else None
            except Exception as e:
                print(f"Error fetching app details for appid {appid}: {e}")

        return jsonify({
            'page': page,
            'page_size': page_size,
            'total_games': total_games,
            'total_pages': (total_games + page_size - 1) // page_size,
            'games': paginated_games
        })
    except Exception as e:
        print(f"Error fetching Steam API: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/gameDetails', methods=['GET'])
def get_game_details():
    try:
        
        appids = request.args.get('appids')

        if not appids:
            return jsonify({'error': 'Missing required query parameter: appids'}), 400

        api_url = f"https://store.steampowered.com/api/appdetails?appids={appids}&filters=basic,metacritic,price_overview"
        print(api_url)
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()

        return jsonify(data)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Game details: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

if __name__ == '__main__':
    app.run(port=3001, debug=True)
