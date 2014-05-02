#!/usr/bin/env node --harmony
/* jshint node: true, evil: true */

'use strict';

var program = require('commander');
var packagejs = require('./package.json');

program.version(packagejs.version)
  .option('-i, --in [path]', 'directory where twitter JSON resides')
  .option('-o, --out [path]', 'directory where markdown files will be saved')
  .parse(process.argv);

var dirIn = program.in;
var dirOut = program.out;

if (!dirIn || !dirOut) {
  console.log('\n  Error: You must specify the in and out parameters');
  program.help();
}

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var moment = require('moment');
var Grailbird = { data: {} };

var TweetDown = function TweetDown(inDir, outDir) {
  this.inDir = inDir;
  this.outDir = outDir;
};

TweetDown.prototype.init = function init() {
  this.getFileList();
  this.evaluateFiles();
};

TweetDown.prototype.getFileList = function getFileList() {
  this.fileList = fs.readdirSync(this.inDir);
};

TweetDown.prototype.evaluateFiles = function evaluateFiles() {
  this.fileList.map((function fileListMap(fileName) {
    var filePath = path.join(this.inDir, fileName);
    var fileData = fs.readFileSync(filePath, { encoding: 'utf8' });
    eval(fileData);
  }).bind(this));
};

TweetDown.prototype.writeFile = function writeFile(tweet, text) {
  var createdAt = new Date(tweet.created_at);
  var momDate = moment(createdAt);
  var dateString = momDate.format('YYYYMMDDHHmmss');
  var yearString = momDate.format('YYYY');
  var monthString = momDate.format('MM');
  
  var outPath = path.join(this.outDir, yearString, monthString);
  mkdirp.sync(outPath);
  
  var outFilePath = path.join(outPath, dateString + '.md');

  fs.writeFileSync(outFilePath, text, { encoding: 'utf8' });
};

TweetDown.prototype.escape = function escapeMarkdown(text) {
  return text.replace(/([\\_\-*+.!`{}()\[\]#])/g, '\\$1');
};

TweetDown.prototype.processFile = function processFile(tweet) {
  var origTweet = tweet;
  var rt = '';

  if (tweet.retweeted_status) {
    tweet = tweet.retweeted_status;
    rt = '[@' + this.escape(origTweet.user.screen_name) + '](http://twitter.com/' + origTweet.user.screen_name + '): RT ';
  }

  var text = tweet.text;

  var createdAt = new Date(tweet.created_at);

  // Generate links from entities
  if (tweet.entities) {
    var offset = 0;

    var userMentions = tweet.entities.user_mentions || [];
    var hashTags = tweet.entities.hashtags || [];
    var media = tweet.entities.media || [];
    var urls = tweet.entities.urls || [];

    var entities = userMentions.concat(hashTags).concat(media).concat(urls);
    entities = entities.sort(function (a, b) {
      return a.indices[0] - b.indices[0];
    });

    var previousIndex = 0;
    var split = [];

    entities.map((function (entity) {
      split.push({ text: this.escape(tweet.text.substring(previousIndex, entity.indices[0])) });
      split.push({ entity: entity });
      previousIndex = entity.indices[1];
    }).bind(this));

    split.push({ text: this.escape(tweet.text.substring(previousIndex)) });

    text = '';
    split.map((function (val) {
      if (val.entity) {
        var entity = val.entity;
        if (entity.screen_name) {
          text += '[@' + this.escape(entity.screen_name) + '](http://twitter.com/' + entity.screen_name + ')';
        } else if (entity.text) {
          text += '[' + this.escape('#' + entity.text) + '](http://twitter.com/search?q=%23' + entity.text + ')';
        } else if (entity.sizes) {
          text += '[' + this.escape(entity.display_url) + '](' + entity.media_url + ')';
        } else if (entity.display_url) {
          text += '[' + this.escape(entity.display_url) + '](' + entity.expanded_url + ')';
        }
      } else {
        text += val.text;
      }
    }).bind(this));
  }

  text = '> ' + rt + '[@' + this.escape(tweet.user.screen_name) + '](http://twitter.com/' + tweet.user.screen_name + '): ' + text;

  text = text.replace(/\n/g, '\n> ') + '\n';

  if (tweet.geo.type) {
    if (tweet.geo.type.toLowerCase() === 'point') {
      text += '\nLocation: [' + this.escape(tweet.geo.coordinates[0] + ', ' + tweet.geo.coordinates[1]) + '](https://www.google.com/maps/@' + tweet.geo.coordinates[0] + ',' + tweet.geo.coordinates[1] + ',13z)';
    }
  }

  text += '\nCreated At: ' + this.escape(createdAt.toString());

  return text;
};

TweetDown.prototype.process = function proc() {
  function monthDataMap(tweet) {
    var text = tweetDown.processFile(tweet);
    tweetDown.writeFile(tweet, text);
  }

  for (var key in Grailbird.data) {
    var monthData = Grailbird.data[key];
    monthData.map(monthDataMap);
  }
};

var tweetDown = new TweetDown(dirIn, dirOut);
tweetDown.init();
tweetDown.process();
