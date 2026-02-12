// ========================================
// LOCAL FIREBASE SDK - OFFLINE SOLUTION
// ========================================
// This is a minimal Firebase SDK implementation for offline/local development

// Mock Firebase implementation for development
class MockFirebase {
    constructor() {
        this.apps = [];
        this.config = null;
    }

    initializeApp(config) {
        this.config = config;
        this.apps.push({ name: '[DEFAULT]', config });
        console.log('✅ Mock Firebase initialized (local mode)');
        return new MockApp();
    }

    get app() {
        return this.apps[0] || new MockApp();
    }
}

class MockApp {
    constructor() {
        this.name = '[DEFAULT]';
    }

    auth() {
        return new MockAuth();
    }

    firestore() {
        return new MockFirestore();
    }

    messaging() {
        return new MockMessaging();
    }
}

class MockAuth {
    constructor() {
        this.currentUser = null;
    }

    onAuthStateChanged(callback) {
        // Simulate user logged in
        setTimeout(() => {
            callback({ uid: 'mock-user', email: 'admin@test.com' });
        }, 1000);
    }

    signInWithEmailAndPassword(email, password) {
        return Promise.resolve({ user: { uid: 'mock-user', email } });
    }

    signOut() {
        return Promise.resolve();
    }
}

class MockFirestore {
    constructor() {
        this.collections = {};
    }

    collection(name) {
        return new MockCollection(name);
    }
}

class MockCollection {
    constructor(name) {
        this.name = name;
    }

    doc(id) {
        return new MockDocument(this.name, id);
    }

    onSnapshot(callback) {
        // Simulate order data
        setTimeout(() => {
            const mockData = {
                docs: [
                    {
                        id: 'mock-order-1',
                        data: () => ({
                            userName: 'Test Customer',
                            totalAmount: 599,
                            status: 'Pending',
                            timestamp: new Date()
                        })
                    }
                ]
            };
            callback(mockData);
        }, 2000);
    }
}

class MockDocument {
    constructor(collectionName, id) {
        this.collectionName = collectionName;
        this.id = id;
    }

    set(data) {
        console.log(`📝 Mock: Set data in ${this.collectionName}/${this.id}:`, data);
        return Promise.resolve();
    }

    get() {
        return Promise.resolve({
            exists: true,
            data: () => ({ mock: 'data' })
        });
    }
}

class MockMessaging {
    constructor() {
        this.token = 'mock-fcm-token-' + Math.random().toString(36).substr(2, 9);
    }

    async requestPermission() {
        return 'granted';
    }

    async getToken(options) {
        console.log('🔑 Mock FCM Token generated:', this.token);
        return this.token;
    }

    onMessage(callback) {
        // Simulate incoming FCM message after 5 seconds
        setTimeout(() => {
            callback({
                notification: {
                    title: '🍕 New Order!',
                    body: 'Test Customer placed an order of ₹599'
                },
                data: {
                    type: 'order',
                    userName: 'Test Customer',
                    totalAmount: '599'
                }
            });
        }, 5000);
    }
}

// Initialize mock Firebase
window.firebase = new MockFirebase();

console.log('✅ Local Firebase SDK loaded (mock implementation)');
