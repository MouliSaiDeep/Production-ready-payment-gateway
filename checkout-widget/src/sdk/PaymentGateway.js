import './style.css';

const CHECKOUT_URL = 'http://localhost:5173/checkout'; // Points to your React App

class PaymentGateway {
    constructor(options) {
        if (!options.key || !options.orderId) {
            throw new Error('PaymentGateway: key and orderId are required');
        }

        this.key = options.key;
        this.orderId = options.orderId;
        this.onSuccess = options.onSuccess || (() => { });
        this.onFailure = options.onFailure || (() => { });
        this.onClose = options.onClose || (() => { });

        this.handleMessage = this.handleMessage.bind(this);
    }

    open() {
        // 1. Create Modal Structure
        this.modal = document.createElement('div');
        this.modal.id = 'payment-gateway-modal';
        this.modal.setAttribute('data-test-id', 'payment-modal');

        this.modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <button data-test-id="close-modal-button" class="close-button">&times;</button>
          <iframe 
            data-test-id="payment-iframe"
            class="payment-iframe"
            src="${CHECKOUT_URL}?order_id=${this.orderId}&embedded=true"
          ></iframe>
        </div>
      </div>
    `;

        // 2. Attach Events
        this.modal.querySelector('.close-button').addEventListener('click', () => {
            this.close();
        });

        // 3. Append to Body
        document.body.appendChild(this.modal);

        // 4. Setup PostMessage Listener
        window.addEventListener('message', this.handleMessage);
    }

    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            window.removeEventListener('message', this.handleMessage);
            this.onClose();
        }
    }

    handleMessage(event) {

        const { type, data } = event.data;

        if (type === 'payment_success') {
            this.onSuccess(data);
            this.close();
        } else if (type === 'payment_failed') {
            this.onFailure(data);
        }
    }
}

export default PaymentGateway;