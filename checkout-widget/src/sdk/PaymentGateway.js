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
        // 1. Inject Styles
        const styleId = 'payment-gateway-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .pg-modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 99999;
                }
                .pg-modal-content {
                    background: white; width: 400px; max-width: 90%; height: 600px; max-height: 90vh;
                    border-radius: 8px; position: relative;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;
                }
                .pg-close-button {
                    position: absolute; top: 10px; right: 15px;
                    background: none; border: none; font-size: 24px; cursor: pointer; color: #666; z-index: 100;
                }
                .pg-payment-iframe {
                    width: 100%; height: 100%; border: none;
                }
            `;
            document.head.appendChild(style);
        }

        // 2. Create Modal Structure
        this.modal = document.createElement('div');
        this.modal.id = 'payment-gateway-modal';
        this.modal.setAttribute('data-test-id', 'payment-modal');

        this.modal.innerHTML = `
      <div class="pg-modal-overlay">
        <div class="pg-modal-content">
          <button data-test-id="close-modal-button" class="pg-close-button">&times;</button>
          <iframe 
            data-test-id="payment-iframe"
            class="pg-payment-iframe"
            src="${CHECKOUT_URL}?order_id=${this.orderId}&embedded=true"
          ></iframe>
        </div>
      </div>
    `;

        // 3. Attach Events
        this.modal.querySelector('.pg-close-button').addEventListener('click', () => {
            this.close();
        });

        // 4. Append to Body
        document.body.appendChild(this.modal);

        // 5. Setup PostMessage Listener
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