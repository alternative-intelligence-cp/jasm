#!/usr/bin/env node
function ClampedValueFactory(id, min, max){
    let nextId=0;
    let constructor = function(value=min){
        //set instance values
        let m_id=`${id}_${getNextId()}`;
        let m_value;
        let m_clamped;
        setValue(value);
        //expose public interface
        this.wasClamped = wasClamped;
        this.getValue = getValue;
        this.setValue = setValue;
        this.getId = getId;
        this.prototype = constructor.prototype;
        ////////////////////////////////////////////////////////////////////////
        function wasClamped(){ 
            return m_clamped; 
        }
        function getValue(){ 
            return m_value; 
        };
        function setValue(value){
            m_clamped = false; 
            if(value >= min){
                if(value <= max){
                    m_value = value;
                } else {
                    m_value = max;
                    m_clamped = true;
                    console.warn(`WARNING--> The value of ${m_id} was clamped to max`);
                }
            } else {
                //clamp to min
                m_value = min;
                m_clamped = true;
                console.warn(`WARNING--> The value of ${m_id} was clamped to min`);
            }
        }
        function getId(){
            return m_id;
        }
        function getNextId(){
            let next = nextId;
            nextId += 1;
            return next;
        }
    }
    constructor.prototype = {
        print:function(){
            console.log(`${this.getId()} --> wasclamped: ${this.wasClamped()}, value: ${this.getValue()}`);
        }
    };
    return constructor;   
}

let ClampedNuts = ClampedValueFactory("clamped_nuts",69,420);
let n = new ClampedNuts(68);
n.print();

let LigmaScore = ClampedValueFactory("ligma_counter", 0,10);
let yourLigmaScore = new LigmaScore(0);
let theirLigmaScore = new LigmaScore(47);
yourLigmaScore.print();
theirLigmaScore.print();

