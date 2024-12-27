############################
# @author Elias De Hondt   #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
from flask import Flask                 # type: ignore

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello from the Backend!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
