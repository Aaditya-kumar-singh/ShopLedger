'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Real persisted order lines have HSN but no gstRate. Keep the field explicitly
// undefined so invoice's fallback and checkout's HSN lookup are characterized.
function item(name, sku, hsn, price, qty) {
  return { name, sku, hsn, price, qty, gstRate: undefined };
}

function assertCurrent(order, expectedInvoice, expectedCheckout) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      total: checkoutFigures.total
    },
    expectedCheckout
  );
}

test('#1001 invoice uses the HSN GST slabs with no coupon', () => {
  const order = {
    items: [
      item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 2),
      item('Unpolished Toor Dal 1kg', 'GRN-002', '0713', 165, 2)
    ],
    coupon: ''
  };

  assertCurrent(order, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  }, { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 });
});

test('#1002 invoice applies SAVE10 before HSN GST', () => {
  const order = {
    items: [
      item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1),
      item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2)
    ],
    coupon: 'SAVE10'
  };

  assertCurrent(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 });
});

test('#1004 invoice applies the SAVE10 ₹150 cap before HSN GST', () => {
  const order = {
    items: [
      item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2)
    ],
    coupon: 'SAVE10'
  };

  assertCurrent(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 });
});

test('CURRENT BEHAVIOUR: #1008 all 18% HSN lines and no coupon happen to match', () => {
  const order = {
    items: [
      item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1),
      item('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2)
    ],
    coupon: ''
  };

  assertCurrent(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, { subtotal: 500, discount: 0, tax: 90, total: 590 });
});

test('invoice figures match checkout HSN GST and capped pre-tax discount for #1004', () => {
  const order = {
    items: [
      item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2)
    ],
    coupon: 'SAVE10'
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual({
    subtotal: figures.subtotal,
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total,
    rows: figures.rows.map(row => ({ gstPercent: row.gstPercent, lineTax: row.lineTax }))
  }, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
    rows: checkout.lines.map(line => ({ gstPercent: line.gstPercent, lineTax: line.tax }))
  });
});
