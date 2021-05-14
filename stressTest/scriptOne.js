import http from 'k6/http';
import { check, sleep } from 'k6';
// const config = require('../config/config');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // below normal load
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 }, // normal load
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '2m', target: 400 },
    { duration: '5m', target: 400 },
    { duration: '2m', target: 600 }, // Around the breaking point
    { duration: '5m', target: 600 },
    { duration: '2m', target: 800 }, // Past the breaking point
    { duration: '5m', target: 800 },
    { duration: '10m', target: 0 }, // scale down. Recovery stage.
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const rnd = Math.floor(Math.random() * 950063);
  const url = 'http://ec2-54-153-104-254.us-west-1.compute.amazonaws.com';
  const sort = ['helpful', 'newest', 'relevant'];
  const randomOption = sort[Math.floor(Math.random() * sort.length)];
  let responses = http.batch([
    [
      'GET',
      `${url}/reviews/?product_id=${rnd}&sort='${randomOption}'/`,
    ],
    [
      'GET',
      `${url}/reviews/?product_id=${Math.floor(rnd/2)}&sort='${randomOption}'/`,
    ],
    [
      'GET',
      `${url}/reviews/?product_id=${Math.floor(rnd/4)}&sort='${randomOption}'/`,
    ],
    [
      'GET',
      `${url}/reviews/?product_id=${Math.floor(rnd/5)}&sort='${randomOption}'/`,
    ],
    [
      'GET',
      `${url}/reviews/?product_id=${Math.floor(rnd/8)}&sort='${randomOption}'/`,
    ],
  ]);
  check(responses[0], {
    'answer34 status was 200': (res) => res.status === 200,
  });
  check(responses[1], {
    'answer35 status was 200': (res) => res.status === 200,
  });
  check(responses[2], {
    'answer36 status was 200': (res) => res.status === 200,
  });
  check(responses[3], {
    'answer37 status was 200': (res) => res.status === 200,
  });
  check(responses[4], {
    'answer38 status was 200': (res) => res.status === 200,
  });
  sleep(1);
};