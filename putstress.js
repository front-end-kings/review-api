import http from 'k6/http';
import { check } from 'k6';

export default function () {
    const rnd = Math.floor(Math.random() * 1000);
    const response = http.put(`http://localhost:3000/reviews/${rnd}/helpful`);
    console.log('Response time was ' + String(response.timings.duration) + 'ms');
    check(response, {
        'is status 204': (r) => r.status === 204,
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