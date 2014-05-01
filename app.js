#!/usr/bin/env node --harmony

'use strict';

let program = require('commander');
let packagejs = require('./package.json');

program.version(packagejs.version)
  .option('-i, --in [path]', 'directory where twitter JSON resides')
  .option('-o, --out [path]', 'directory where markdown files will be saved')
  .parse(process.argv);

let dir = program.in;
let out = program.out;

if (!dir || !out) {
  console.log('\n  Error: You must specify the in and out parameters');
  program.help();
}

let fs = require('fs');
let path = require('path');
let mkdirp = require('mkdirp');
let _ = require('lodash');
let moment = require('moment');
let Grailbird = { data: {} };

let fileList = fs.readdirSync(dir);

for (let m = 0, n = fileList.length; m < n; m++) {
  let filePath = path.join(dir, fileList[m]);
  let fileData = fs.readFileSync(filePath, { encoding: 'utf8' });
  eval(fileData.toString());
}

for(let key in Grailbird.data) {
  let monthData = Grailbird.data[key];

  for (let i = 0, j = monthData.length; i < j; i++) {
    let tweet = monthData[i];
    let origTweet = tweet;
    let rt = '';

    if (tweet.retweeted_status) {
      tweet = tweet.retweeted_status;
      rt = '[@' + origTweet.user.screen_name + '](http://twitter.com/' + tweet.user.screen_name + '): RT ';
    }

    let text = tweet.text;

    let createdAt = new Date(tweet.created_at);

    // Generate links from entities
    if (tweet.entities) {
      let offset = 0;

      let userMentions = tweet.entities.user_mentions || [];
      let hashTags = tweet.entities.hashtags || [];
      let media = tweet.entities.media || [];
      let urls = tweet.entities.urls || [];

      let entities = userMentions.concat(hashTags).concat(media).concat(urls);
      entities = entities.sort(function (a, b) {
        return a.indices[0] - b.indices[0];
      });

      for (let x = 0, y = entities.length; x < y; x++) {
        let entity = entities[x];
        let pre = text.substr(0, entity.indices[0] + offset);
        let post = text.substr(entity.indices[1] + offset);
        let len = entity.indices[1] - entity.indices[0];
        
        let md = null;

        if (entity.screen_name) {
          md = '[@' + entity.screen_name + '](http://twitter.com/' + entity.screen_name + ')';
        } else if (entity.text) {
          md = '[#' + entity.text + '](http://twitter.com/search?q=%23' + entity.text + ')';
        } else if (entity.sizes) {
          md = '[' + entity.display_url + '](' + entity.media_url + ')';
        } else if (entity.display_url) {
          md = '[' + entity.display_url + '](' + entity.expanded_url + ')';
        }

        if (md !== null) {
          offset += md.length - len;
          text = pre + md + post;
        }
      }
    }

    text = '> ' + rt + '[@' + tweet.user.screen_name + '](http://twitter.com/' + tweet.user.screen_name + '): ' + text + '\n';

    if (tweet.geo.type) {
      if (tweet.geo.type.toLowerCase() === 'point') {
        text += '\nLocation: [' + tweet.geo.coordinates[0] + ', ' + tweet.geo.coordinates[1] + '](https://www.google.com/maps/@' + tweet.geo.coordinates[0] + ',' + tweet.geo.coordinates[1] + ',13z)';
      }
    }

    text += '\nCreated At: ' + createdAt;

    let momDate = moment(createdAt);
    let dateString = momDate.format('YYYYMMDDHHmmss');
    let yearString = momDate.format('YYYY');
    let monthString = momDate.format('MM');
    let outDir = path.join(out, yearString, monthString);
    mkdirp.sync(outDir);
    let outFilePath = path.join(outDir, dateString + '.md');
    fs.writeFileSync(outFilePath, text, { encoding: 'utf-8' });
  }
}
