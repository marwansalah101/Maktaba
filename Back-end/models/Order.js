const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        // Optional: title-only items (e.g. a removed book) are allowed and stored
        // with bookId:null by the order handler. Was required:true (note §5.2).
        required: false
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: {
        type: String,
        default: ""
    }
});

const shippingAddressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ""
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    
    customerInfo: {
        email: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        }
    },

    items: [orderItemSchema],

    shippingAddress: shippingAddressSchema,

    paymentInfo: {
        method: {
            type: String,
            required: true,
            enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: {
            type: String,
            default: ""
        }
    },

    orderSummary: {
        subtotal: {
            type: Number,
            required: true
        },
        shipping: {
            type: Number,
            required: true,
            default: 0
        },
        tax: {
            type: Number,
            required: true,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    },

    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },

    trackingNumber: {
        type: String,
        default: ""
    },

    notes: {
        type: String,
        default: ""
    }

}, { 
    timestamps: true,
    collection: 'orders'
});

// Generate order number BEFORE validation (validate runs before save in
// Mongoose, so a pre('save') hook would set it too late for the required check).
orderSchema.pre('validate', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Find the last order of today to get the next sequence number
        const todayStart = new Date(year, date.getMonth(), date.getDate());
        const todayEnd = new Date(year, date.getMonth(), date.getDate() + 1);
        
        const lastOrder = await this.constructor.findOne({
            createdAt: { $gte: todayStart, $lt: todayEnd }
        }).sort({ createdAt: -1 });
        
        let sequence = 1;
        if (lastOrder && lastOrder.orderNumber) {
            const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop());
            sequence = lastSequence + 1;
        }
        
        this.orderNumber = `MKT-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model("Order", orderSchema);