deploy:
	git push heroku main

provision-servers:
	heroku ps:scale web=1

logs:
	heroku logs --tail