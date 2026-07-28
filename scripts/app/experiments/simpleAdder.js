#!/usr/bin/env node
function add(a,b,carry){
    let out = {digit:0,carry:0}; // 0/3
    if(a && b && carry){ // 3/3
            out.digit=1;
            out.carry=1;
    } else if((a && b) || (a && carry) || (b && carry)){ // 2/3
            out.digit=0;
            out.carry=1;
    } else if (a || b || carry){ // 1/3
            out.digit=1;
            out.carry=0;
    }
    return out;
}
////////////////////////////////////////////////////////////////////////////////
let a=1,
    b=0,
    carry=0;
console.log(`${a} + ${b}, carry:${carry} = ${JSON.stringify(add(a,b,carry))}`);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function sq(num){
    return num*num;
}

function sqrt(num){
    let counter = 0;
    let guess = 1;
    while((guess * 8) * (guess * 8) <= num){
        guess = guess * 8;
        counter++;
    }
    counter++;
    while((guess * 4) * (guess * 4) <= num){
        guess = guess * 4;
        counter++;
    }
    counter++; 
    while((guess * 2) * (guess * 2) <= num){
        guess = guess * 2;
        counter++;
    }
    counter++; 
    while(((guess + 1) * (guess + 1)) <= num){
        guess += 1;
        counter++;
    }
    counter++
    console.log("counter: " + counter);
    return guess;
}
//console.log(sqrt(8225259818*8225259818));
console.log(sqrt(345678))
console.log(sqrt(23456))
console.log(sqrt(1103))
console.log(sqrt(144));
console.log(sqrt(64));
console.log(sqrt(16));
console.log(sqrt(9));