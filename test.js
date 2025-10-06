/*input: [5, 3, 7, 2, 9] = 100
        [5,3,2,9] = 51

//  */
// function calc(arr) {
//   let res = 0;
//   let l = arr.length;
//   for (let i = 0; i < Math.floor(l / 2); i++) {
//     console.log(arr[i], arr[l - 1 - i]);
//     res += arr[i] * arr[l - 1 - i];
//   }
//   if (arr.length % 2 !== 0) {
//     let j = Math.trunc(l / 2);
//     console.log(j);
//     res += arr[j] * arr[j];
//   }
//   console.log(res);
//   return res;
// }
// calc([5, 3, 7, 2, 9]);
function calc(arr) {
  let l = 0;
  let r = arr.length - 1;
  let res = 0;
  while (l < r) {
    res += arr[l] * arr[r];
    l++;
    r--;
    if (l == r) res += arr[l] ** 2;
  }
  console.log(res);
}
calc([5, 3, 7, 2, 9]);
