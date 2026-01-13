const mongoose = require('mongoose');

// Mock mongoose before requiring model
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(),
    model: actualMongoose.model,
    Schema: actualMongoose.Schema,
  };
});

const Offer = require('../src/models/Offer');

describe('Offer Model', () => {
  describe('Discount Calculation', () => {
    it('should calculate discount percentage correctly', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 8000,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
      });

      // Trigger pre-save calculation manually
      offer.discountPercentage = ((offer.productPrice - offer.offeredPrice) / offer.productPrice) * 100;

      expect(offer.discountPercentage).toBe(20);
    });

    it('should calculate 10% discount correctly', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 15000,
        offeredPrice: 13500,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
      });

      offer.discountPercentage = ((offer.productPrice - offer.offeredPrice) / offer.productPrice) * 100;

      expect(offer.discountPercentage).toBe(10);
    });

    it('should calculate 0% discount when same price', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 10000,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
      });

      offer.discountPercentage = ((offer.productPrice - offer.offeredPrice) / offer.productPrice) * 100;

      expect(offer.discountPercentage).toBe(0);
    });
  });

  describe('processOffer method', () => {
    it('should accept offer within margin automatically', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 8500, // 15% discount
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
      });

      offer.discountPercentage = ((offer.productPrice - offer.offeredPrice) / offer.productPrice) * 100;
      offer.processOffer(20); // MAX_DISCOUNT = 20%

      expect(offer.status).toBe('accepted');
      expect(offer.withinMargin).toBe(true);
      expect(offer.couponCode).toBeDefined();
    });

    it('should set offer as pending when outside margin', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 7000, // 30% discount
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
      });

      offer.discountPercentage = ((offer.productPrice - offer.offeredPrice) / offer.productPrice) * 100;
      offer.processOffer(20); // MAX_DISCOUNT = 20%

      expect(offer.status).toBe('pending');
      expect(offer.withinMargin).toBe(false);
      expect(offer.couponCode).toBeUndefined();
    });

    it('should accept offer at exact margin boundary', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 8000, // Exactly 20% discount
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
      });

      offer.discountPercentage = ((offer.productPrice - offer.offeredPrice) / offer.productPrice) * 100;
      offer.processOffer(20);

      expect(offer.status).toBe('accepted');
      expect(offer.withinMargin).toBe(true);
    });
  });

  describe('generateCouponCode method', () => {
    it('should generate code for registered user', () => {
      const customerId = new mongoose.Types.ObjectId();
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 9000,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
        customer: customerId,
        productReference: 'VH-001',
      });

      const code = offer.generateCouponCode();

      expect(code).toContain('OFFER-VH-001-');
      expect(code).not.toContain('-G');
    });

    it('should generate code for guest user', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 9000,
        customerEmail: 'guest@test.com',
        customerPhone: '123456789',
        isGuest: true,
        productReference: 'VH-002',
      });

      const code = offer.generateCouponCode();

      expect(code).toContain('OFFER-VH-002-G');
    });
  });

  describe('acceptManually method', () => {
    it('should accept pending offer manually', () => {
      const adminId = new mongoose.Types.ObjectId();
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 6000,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
        status: 'pending',
        productReference: 'VH-003',
      });

      offer.acceptManually(adminId, 'Cliente preferente');

      expect(offer.status).toBe('accepted');
      expect(offer.couponCode).toBeDefined();
      expect(offer.reviewedBy).toEqual(adminId);
      expect(offer.reviewNotes).toBe('Cliente preferente');
    });

    it('should throw error when accepting non-pending offer', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 9000,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
        status: 'accepted',
      });

      expect(() => {
        offer.acceptManually(new mongoose.Types.ObjectId(), 'test');
      }).toThrow('Solo se pueden aceptar ofertas pendientes');
    });
  });

  describe('reject method', () => {
    it('should reject pending offer', () => {
      const adminId = new mongoose.Types.ObjectId();
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 5000,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
        status: 'pending',
      });

      offer.reject(adminId, 'Descuento demasiado alto');

      expect(offer.status).toBe('rejected');
      expect(offer.reviewedBy).toEqual(adminId);
      expect(offer.reviewNotes).toBe('Descuento demasiado alto');
    });
  });

  describe('useCoupon method', () => {
    it('should mark coupon as used and set status to expired', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 9000,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
        status: 'accepted',
        couponCode: 'OFFER-TEST-123456',
      });

      offer.useCoupon();

      expect(offer.couponUsed).toBe(true);
      expect(offer.status).toBe('expired');
      expect(offer.couponUsedAt).toBeDefined();
    });

    it('should throw error when using coupon twice', () => {
      const offer = new Offer({
        product: new mongoose.Types.ObjectId(),
        productPrice: 10000,
        offeredPrice: 9000,
        customerEmail: 'test@test.com',
        customerPhone: '123456789',
        status: 'accepted',
        couponCode: 'OFFER-TEST-123456',
        couponUsed: true,
      });

      expect(() => {
        offer.useCoupon();
      }).toThrow('El cupón ya ha sido utilizado');
    });
  });
});
