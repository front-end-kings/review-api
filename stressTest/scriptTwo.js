import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const rnd = Math.floor(Math.random() * 950063);
  const url = `http://localhost:3000`;
  // const url = 'http://ec2-54-176-81-128.us-west-1.compute.amazonaws.com';
  const sort = ['helpful', 'newest', 'relevant'];
  const randomOption = sort[Math.floor(Math.random() * sort.length)];
  const response = http.get(`${url}/reviews/?product_id=${rnd}&sort='${randomOption}'/`);
  console.log('Response time was ' + String(response.timings.duration) + ' ms');
  check(response, {
    "is status 200": (r) => r.status === 200,
  });
};

export let options = {
  ext: {
    loadimpact: {
      name: 'scriptTwo.js',
      projectID: '3536493'
    },
  },
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};