// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-mongodb
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

require('./init.js');
const ds = global.getDataSource();
const ObjectID = require('../lib/mongodb').ObjectID;
const objectIDLikeString = '7cd2ad46ffc580ba45d3cb1f';

describe('mongodb custom id name', function() {
  const Customer = ds.createModel(
    'customer',
    {
      seq: {type: Number, id: true},
      name: String,
      emails: [String],
      age: Number,
    },
    {forceId: false},
  );
  before(function(done) {
    Customer.deleteAll(done);
  });

  it('should allow custom name for the id property for create', function(done) {
    Customer.create(
      {
        seq: 1,
        name: 'John1',
        emails: ['john@x.com', 'john@y.com'],
        age: 30,
      },
      function(err, customer) {
        customer.seq.should.equal(1);
        Customer.create(
          {
            seq: 2,
            name: 'John2',
            emails: ['john2@x.com', 'john2@y.com'],
            age: 40,
          },
          function(err, customer) {
            customer.seq.should.equal(2);
            done(err, customer);
          },
        );
      },
    );
  });

  it('should allow custom name for the id property for findById', function(done) {
    Customer.findById(1, function(err, customer) {
      customer.seq.should.equal(1);
      done(err, customer);
    });
  });

  it('should allow inq with find', function(done) {
    Customer.find({where: {seq: {inq: [1]}}}, function(err, customers) {
      customers.length.should.equal(1);
      customers[0].seq.should.equal(1);
      done(err);
    });
  });
});

describe('mongodb default id type', function() {
  const Account = ds.createModel(
    'account',
    {
      seq: {id: true, generated: true},
      name: String,
      emails: [String],
      age: Number,
    },
    {forceId: false},
  );

  before(function(done) {
    Account.deleteAll(done);
  });

  let id;
  it('should generate id value for create', function(done) {
    Account.create(
      {
        name: 'John1',
        emails: ['john@x.com', 'john@y.com'],
        age: 30,
      },
      function(err, account) {
        if (err) return done(err);
        account.should.have.property('seq');
        id = account.seq;
        Account.findById(id, function(err, account1) {
          if (err) return done(err);
          account1.seq.should.eql(account.seq);
          account.should.have.property('seq');
          done(err, account1);
        });
      },
    );
  });

  it('should be able to find by id', function(done) {
    // Try to look up using string
    Account.findById(id, function(err, account1) {
      if (err) return done(err);
      account1.seq.should.eql(id);
      done(err, account1);
    });
  });

  it('should be able to delete by string id', function(done) {
    // Try to look up using string
    Account.destroyById(id, function(err, info) {
      if (err) return done(err);
      info.count.should.eql(1);
      done(err);
    });
  });
});

describe('mongodb default id name', function() {
  const Customer1 = ds.createModel(
    'customer1',
    {name: String, emails: [String], age: Number},
    {forceId: false},
  );

  before(function(done) {
    Customer1.deleteAll(done);
  });

  it('should generate id value for create', function(done) {
    Customer1.create(
      {
        name: 'John1',
        emails: ['john@x.com', 'john@y.com'],
        age: 30,
      },
      function(err, customer) {
        customer.should.have.property('id');
        Customer1.findById(customer.id, function(err, customer1) {
          customer1.id.should.eql(customer.id);
          done(err, customer);
        });
      },
    );
  });
});

describe('autogenerated ids', function() {
  const Customer = ds.createModel(
    'Customer',
    {name: String, emails: [String], age: Number},
    {forceId: false},
  );

  before(function(done) {
    Customer.deleteAll(done);
  });

  it('should not allow value for autogenerated id', async function() {
    await Customer.create({
      id: 1,
      name: 'John1',
      emails: ['john@x.com', 'john@y.com'],
      age: 30,
    }).should.be.rejectedWith(/Cannot specify value for autogenerated id/);
  });
});

describe('non-generated ObjectId id', function() {
  const Book = ds.createModel(
    'Book',
    {id: {type: String, mongodb: {dataType: 'ObjectId'}, id: true}, title: String},
  );

  before(function(done) {
    Book.deleteAll(done);
  });

  let id;
  it('should be able to specify custom ObjectId string id value', function(done) {
    Book.create(
      {
        id: objectIDLikeString,
        title: 'Jungle',
      },
      function(err, book) {
        if (err) return done(err);
        id = book.id;
        Book.findById(id, function(err, found) {
          if (err) return done(err);
          found.id.should.eql(book.id);
          done(err, found);
        });
      },
    );
  });

  it('should be able to find by id', function(done) {
    // Try to look up using string
    Book.findById(id, function(err, found) {
      if (err) return done(err);
      found.id.should.eql(id);
      done(err, found);
    });
  });

  it('should be able to delete by string id', function(done) {
    // Try to look up using string
    Book.destroyById(id, function(err, info) {
      if (err) return done(err);
      info.count.should.eql(1);
      done(err);
    });
  });

  it('should require value for non-autogenerated ObjectId id', async function() {
    await Book.create({
      title: 'Jungle'
    }).should.be.rejectedWith(/Value is required for non-autogenerated id/);
  });

  it('should detect invalid ObjectId string', async function() {
    await Book.create({
      id: 3,
      title: 'Jungle'
    }).should.be.rejectedWith(/Invalid ObjectId string/);
  });

  it('should stringify ObjectId', async function() {
    const oId = ObjectID(objectIDLikeString);
    const book = await Book.create({
      id: oId,
      title: 'Jungle'
    });
    book.id.should.equal(oId.toString());
    const found = await Book.findById(oId);
    found.id.should.equal(oId.toString());
  });

});
