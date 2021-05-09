import http from 'k6/http';
import { check } from 'k6';

export default function () {
    const rnd = Math.floor(Math.random() * 1000);
    const response = http.get(`http://localhost:3000/reviews/?product_id=${rnd}/`);
    console.log('Response time was ' + String(response.timings.duration) + 'ms');
    check(response, {
        'is status 200': (r) => r.status === 200,
    });
};

export let options = {
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
};