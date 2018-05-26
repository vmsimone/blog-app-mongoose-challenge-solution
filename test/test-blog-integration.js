const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL, PORT } = require('../config');

chai.use(chaiHttp);

function seedData() {
  console.info('now building test database');
  const sandbox = [];

  for (i=0; i<=10; i++) {
    sandbox.push(generateTestData());
  }
  return BlogPost.insertMany(sandbox);
}

function randomize(variable) {
  return variable[Math.floor(Math.random() * variable.length)];
}

function generateTitle() {
  const possibleTitles = ["10 things -- you won't believe #4", "generititle", 'thinj', 'bloggo'];
  const ranTitle = randomize(possibleTitles);
  return ranTitle;
}

function generateAuthor() {
  const possibleAuthors = [
    {first: 'Travis', last: 'Bickle'},
    {first: 'James', last: 'Brown'},
    {first: 'Fred', last: 'Weasley'},
    {first: 'Ginny', last: 'Weasley'},
    {first: 'Forrest', last: 'Gump'},
    {first: 'Rachel', last: 'Ray'},
    {first: 'Girl', last: 'Please'}];
  const ranAuthor = randomize(possibleAuthors);
  return {
    firstName: ranAuthor.first,
    lastName: ranAuthor.last
  }
}

function generateContent() {
  const possibleContent = ["Lorem ipsum dolor sit amet, consectetur adipisicing elit,", "Loerl", "blogs"];
  const ranContent = randomize(possibleContent);
  return ranContent;
}

function generateTestData() {
  return {
    title: generateTitle(),
    author: generateAuthor(),
    content: generateContent()
  }
}

function tearDownThisWall() {
  console.warn('Deleting Database, Mr. Gorbachev');
  return mongoose.connection.dropDatabase();
}

describe('Blog posts resource', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedData();
  });

  afterEach(function() {
    return tearDownThisWall();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {

    it('should return 10 test blog posts', function() {
      let res;
      return chai.request(app)
        .get('/blog-app')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body.blogposts).to.have.lenghtOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body.blogposts).to.have.lengthOf(count);
        });
    });
  })

});
