function climbingETA(startTime: Date, distanceInFeet: number) {
    let durationInMin = distanceInFeet / 13;
  
    // convert to milliseconds, the smallest unit of duration that's
    // represented in a JavaScript Date.
    let durationInMS = Math.floor(durationInMin * 60 * 1000);
  
    return new Date(startTime.getTime() + durationInMS);
  }
  
  export { climbingETA}