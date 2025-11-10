from flask import Flask, jsonify
import subprocess
import os

app = Flask(__name__)

SCRIPT_DIR = os.getcwd()  # espera-se que os scripts estejam no diretório de trabalho da imagem

def run_script(path):
    """
    Executa o script em 'path' usando subprocess.run.
    Retorna (payload_dict, http_status).
    """
    try:
        completed = subprocess.run([path], check=True, capture_output=True, text=True, env=os.environ)
        output = completed.stdout.strip() if completed.stdout else ''
        return ({"status": "success", "output": output}, 200)
    except subprocess.CalledProcessError as e:
        err_msg = (e.stderr or e.stdout or str(e)).strip()
        return ({"status": "error", "message": err_msg}, 500)
    except Exception as e:
        return ({"status": "error", "message": str(e)}, 500)

@app.route('/backup', methods=['POST'])
def backup():
    script_path = os.path.join(SCRIPT_DIR, 'backup.sh')
    payload, status = run_script(script_path)
    return jsonify(payload), status

@app.route('/restore', methods=['POST'])
def restore():
    script_path = os.path.join(SCRIPT_DIR, 'restore.sh')
    payload, status = run_script(script_path)
    return jsonify(payload), status

# health endpoint simples
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
