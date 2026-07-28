#!/usr/bin/env node
function Test() {
    var t = 12;
    this.getT = function () { return t; }
    this.setT = function (val) { t = val; }
}
let a = new Test();
console.log(`${a.getT()}`);
a.setT(69);
console.log(a.getT());


////////////////////////////////////////////////////////////////////////////////
/*
#include <stdio.h> //for print f
#include <malloc.h> //for malloc,free

typedef struct my_type_t MyType;
typedef struct my_type_t {
    int a;
    int b;
}MyType;

MyType* MyType_new(a,b){
    let instance = (*MyType)malloc(sizeof(MyType));
    instance->a = a;
    instance->b = b;
    return instance;
}
void MyType_destroy(MyType instance){
    free(instance);
}
int MyType_sum(MyType instance){
    return instance->a + instance->b;
}


MyType* mt = MyType_new(20,30);
int sum = MyType_sum(mt);
printf("The sum is %d!\n",sum); 
MyType_destroy(mt);
*/
////////////////////////////////////////////////////////////////////////////////

function MyType(a, b){
    this.a = a;
    this.b = b;
    this.sum = function(){
        return this.a + this.b;
    };
}
let mt = new MyType(20,30);
let sum = mt.sum();
console.log(`The sum is ${sum}!`);
