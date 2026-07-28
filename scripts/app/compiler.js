export class Compiler {
    constructor() {
        this.vars = {}; // Maps variable name to register e.g., RS1
        this.varCount = 0;
        this.labelCount = 0;
        this.output = [];
        this.strings = {};
        this.stringCount = 0;
    }

    compile(source) {
        this.vars = {};
        this.varCount = 0;
        this.labelCount = 0;
        this.output = [];
        this.strings = {};
        this.stringCount = 0;
        
        let tokens = this.tokenize(source);
        let ast = this.parse(tokens);
        this.generate(ast);
        
        return this.output.join('\n');
    }

    emit(str) {
        this.output.push(str);
    }
    
    getLabel() {
        return "L_" + (this.labelCount++);
    }

    getVarReg(name) {
        if (!this.vars[name]) {
            this.varCount++;
            if (this.varCount > 8) throw new Error("Too many variables! Max 8 supported.");
            this.vars[name] = "RS" + this.varCount;
        }
        return this.vars[name];
    }

    getStringRef(value) {
        for (let name in this.strings) {
            if (this.strings[name] === value) return name;
        }
        let name = "str" + this.stringCount++;
        this.strings[name] = value;
        return name;
    }

    // --- LEXER ---
    tokenize(source) {
        const tokens = [];
        let cursor = 0;
        while (cursor < source.length) {
            let char = source[cursor];
            
            // Skip whitespace
            if (/\s/.test(char)) {
                cursor++;
                continue;
            }
            
            // Skip comments
            if (char === '/' && source[cursor+1] === '/') {
                while (cursor < source.length && source[cursor] !== '\n') cursor++;
                continue;
            }

            // Punctuation
            if ("{};(),".includes(char)) {
                tokens.push({ type: 'PUNC', value: char });
                cursor++;
                continue;
            }
            
            // Strings
            if (char === '"' || char === "'") {
                let quote = char;
                let str = "";
                cursor++;
                while (cursor < source.length && source[cursor] !== quote) {
                    str += source[cursor++];
                }
                cursor++; // consume closing quote
                tokens.push({ type: 'STR', value: str });
                continue;
            }
            
            // Operators (2 char)
            let twoChar = source.substr(cursor, 2);
            if (["==", "!=", "<=", ">="].includes(twoChar)) {
                tokens.push({ type: 'OP', value: twoChar });
                cursor += 2;
                continue;
            }
            // Operators (1 char)
            if ("+-*/=<>".includes(char)) {
                tokens.push({ type: 'OP', value: char });
                cursor++;
                continue;
            }

            // Numbers
            if (/\d/.test(char)) {
                let num = "";
                while (cursor < source.length && /\d/.test(source[cursor])) {
                    num += source[cursor++];
                }
                tokens.push({ type: 'NUM', value: parseInt(num, 10) });
                continue;
            }

            // Identifiers / Keywords
            if (/[a-zA-Z_]/.test(char)) {
                let id = "";
                while (cursor < source.length && /[a-zA-Z0-9_]/.test(source[cursor])) {
                    id += source[cursor++];
                }
                const keywords = ["var", "while", "if", "print", "exit", "printStr", "poke"];
                if (keywords.includes(id)) {
                    tokens.push({ type: 'KW', value: id });
                } else {
                    tokens.push({ type: 'ID', value: id });
                }
                continue;
            }

            throw new Error("Unexpected character: " + char);
        }
        return tokens;
    }

    // --- PARSER ---
    parse(tokens) {
        let cursor = 0;

        const peek = () => tokens[cursor];
        const next = () => tokens[cursor++];
        const expect = (type, val) => {
            let t = next();
            if (!t || t.type !== type || (val && t.value !== val)) {
                throw new Error(`Expected ${type} ${val || ''} but got ${t ? t.type + ' ' + t.value : 'EOF'}`);
            }
            return t;
        };

        const parseExpression = () => {
            return parseBinary(0);
        };

        const parseBinary = (precedence) => {
            let left = parsePrimary();
            while (peek() && peek().type === 'OP') {
                let op = peek().value;
                let opPrec = getPrecedence(op);
                if (opPrec < precedence) break;
                next(); // consume op
                let right = parseBinary(opPrec + 1);
                left = { type: 'Binary', op, left, right };
            }
            return left;
        };

        const getPrecedence = (op) => {
            if (["==", "!=", "<", ">", "<=", ">="].includes(op)) return 1;
            if (["+", "-"].includes(op)) return 2;
            if (["*", "/"].includes(op)) return 3;
            return 0;
        };

        const parsePrimary = () => {
            let t = next();
            if (t.type === 'NUM') return { type: 'Number', value: t.value };
            if (t.type === 'STR') return { type: 'StringLiteral', value: t.value };
            if (t.type === 'ID') {
                if (t.value === 'peek') {
                    expect('PUNC', '(');
                    let addr = parseExpression();
                    expect('PUNC', ')');
                    return { type: 'Peek', addr };
                }
                return { type: 'Identifier', value: t.value };
            }
            if (t.type === 'PUNC' && t.value === '(') {
                let expr = parseExpression();
                expect('PUNC', ')');
                return expr;
            }
            throw new Error("Unexpected token in expression: " + t.value);
        };

        const parseStatement = () => {
            let t = peek();
            if (t.type === 'KW') {
                if (t.value === 'var') {
                    next();
                    let id = expect('ID').value;
                    expect('OP', '=');
                    let init = parseExpression();
                    expect('PUNC', ';');
                    return { type: 'VarDecl', id, init };
                }
                if (t.value === 'while') {
                    next();
                    expect('PUNC', '(');
                    let condition = parseExpression();
                    expect('PUNC', ')');
                    let body = parseBlock();
                    return { type: 'While', condition, body };
                }
                if (t.value === 'if') {
                    next();
                    expect('PUNC', '(');
                    let condition = parseExpression();
                    expect('PUNC', ')');
                    let body = parseBlock();
                    return { type: 'If', condition, body };
                }
                if (t.value === 'print') {
                    next();
                    expect('PUNC', '(');
                    let expr = parseExpression();
                    expect('PUNC', ')');
                    expect('PUNC', ';');
                    return { type: 'Print', expr };
                }
                if (t.value === 'exit') {
                    next();
                    expect('PUNC', '(');
                    let expr = parseExpression();
                    expect('PUNC', ')');
                    expect('PUNC', ';');
                    return { type: 'Exit', expr };
                }
                if (t.value === 'printStr') {
                    next();
                    expect('PUNC', '(');
                    let expr = parseExpression();
                    expect('PUNC', ')');
                    expect('PUNC', ';');
                    return { type: 'PrintStr', expr };
                }
                if (t.value === 'poke') {
                    next();
                    expect('PUNC', '(');
                    let addr = parseExpression();
                    expect('PUNC', ',');
                    let val = parseExpression();
                    expect('PUNC', ')');
                    expect('PUNC', ';');
                    return { type: 'Poke', addr, val };
                }
            }
            if (t.type === 'ID') {
                let id = next().value;
                expect('OP', '=');
                let expr = parseExpression();
                expect('PUNC', ';');
                return { type: 'Assign', id, expr };
            }
            throw new Error("Unexpected statement token: " + t.value);
        };

        const parseBlock = () => {
            expect('PUNC', '{');
            let body = [];
            while (peek() && peek().value !== '}') {
                body.push(parseStatement());
            }
            expect('PUNC', '}');
            return { type: 'Block', body };
        };

        let ast = [];
        while (cursor < tokens.length) {
            ast.push(parseStatement());
        }
        return ast;
    }

    // --- CODE GENERATOR ---
    generate(ast) {
        let storedOutput = this.output;
        this.output = []; // temp buffer
        for (let node of ast) {
            this.genNode(node);
        }
        let codeBuffer = this.output;
        this.output = storedOutput;

        this.emit("// --- COMPILER GENERATED JASM ---");
        for (let name in this.strings) {
            this.emit(`DEF( ${name}, '${this.strings[name]}' );`);
        }
        for (let line of codeBuffer) {
            this.emit(line);
        }
    }

    genNode(node) {
        if (node.type === 'VarDecl' || node.type === 'Assign') {
            this.genExpr(node.init || node.expr); // Leaves result in RO1
            let reg = this.getVarReg(node.id);
            this.emit(`MOV( U32, ${reg}, RO1 );`);
        } else if (node.type === 'Print') {
            this.genExpr(node.expr);
            this.emit(`MOV( U32, RO3, RO1 );`);
            this.emit(`SET( U32, RO1, 0 );`); // Syscall 0 (Print Int)
            this.emit(`SYS();`);
        } else if (node.type === 'Exit') {
            this.genExpr(node.expr);
            this.emit(`MOV( U32, RO3, RO1 );`);
            this.emit(`SET( U32, RO1, 1 );`); // Syscall 1 (Exit)
            this.emit(`SYS();`);
        } else if (node.type === 'While') {
            let startLbl = this.getLabel();
            let endLbl = this.getLabel();
            this.emit(`LBL( ${startLbl} );`);
            this.genExpr(node.condition); // Leaves FLG set based on condition
            // Invert the condition to jump to end if FALSE
            this.genJump(node.condition.op, endLbl, true);
            for (let stmt of node.body.body) this.genNode(stmt);
            this.emit(`JMP( ${startLbl} );`);
            this.emit(`LBL( ${endLbl} );`);
        } else if (node.type === 'If') {
            let endLbl = this.getLabel();
            this.genExpr(node.condition);
            this.genJump(node.condition.op, endLbl, true);
            for (let stmt of node.body.body) this.genNode(stmt);
            this.emit(`LBL( ${endLbl} );`);
        } else if (node.type === 'PrintStr') {
            this.genExpr(node.expr);
            this.emit(`PSH( U32, RS1 );`);
            this.emit(`PSH( U32, RS2 );`);
            this.emit(`MOV( U32, RS2, RO1 );`); // address in RS2
            this.emit(`SET( U32, RS1, 0 );`);   // 0 length = null terminated
            this.emit(`SET( U32, RO1, 2 );`);   // Syscall 2 (Print String)
            this.emit(`SYS();`);
            this.emit(`POP( U32, RS2 );`);
            this.emit(`POP( U32, RS1 );`);
        } else if (node.type === 'Poke') {
            this.genExpr(node.val);
            this.emit(`PSH( U32, RO1 );`);
            this.genExpr(node.addr);
            this.emit(`MOV( U32, RO2, RO1 );`); // address in RO2
            this.emit(`POP( U32, RO1 );`);      // val in RO1
            this.emit(`STR( U32, RO1, RO2 );`);
        }
    }

    genExpr(node) {
        if (node.type === 'Number') {
            this.emit(`SET( U32, RO1, ${node.value} );`);
        } else if (node.type === 'StringLiteral') {
            let ref = this.getStringRef(node.value);
            this.emit(`SET( U32, RO1, ${ref} );`);
        } else if (node.type === 'Peek') {
            this.genExpr(node.addr);
            this.emit(`MOV( U32, RO2, RO1 );`);
            this.emit(`LOD( U32, RO1, RO2 );`);
        } else if (node.type === 'Identifier') {
            let reg = this.getVarReg(node.value);
            this.emit(`MOV( U32, RO1, ${reg} );`);
        } else if (node.type === 'Binary') {
            this.genExpr(node.left);
            this.emit(`PSH( U32, RO1 );`);
            this.genExpr(node.right);
            this.emit(`MOV( U32, RO2, RO1 );`); // right to RO2
            this.emit(`POP( U32, RO1 );`);      // left to RO1
            
            switch (node.op) {
                case '+':
                    this.emit(`ADD();`);
                    this.emit(`MOV( U32, RO1, RO3 );`);
                    break;
                case '-':
                    this.emit(`SUB();`);
                    this.emit(`MOV( U32, RO1, RO3 );`);
                    break;
                case '*':
                    this.emit(`MUL();`);
                    this.emit(`MOV( U32, RO1, RO3 );`);
                    break;
                case '/':
                    this.emit(`DIV();`);
                    this.emit(`MOV( U32, RO1, RO3 );`);
                    break;
                case '==':
                case '!=':
                case '<':
                case '>':
                case '<=':
                case '>=':
                    this.emit(`CMP( U32, RO1, RO2 );`);
                    break;
            }
        }
    }

    genJump(op, label, invert) {
        if (!invert) {
            if (op === '==') this.emit(`JIE( ${label} );`);
            if (op === '!=') this.emit(`JNE( ${label} );`);
            if (op === '<') this.emit(`JLT( ${label} );`);
            if (op === '>') this.emit(`JGT( ${label} );`);
            if (op === '<=') this.emit(`JLE( ${label} );`);
            if (op === '>=') this.emit(`JGE( ${label} );`);
        } else {
            if (op === '==') this.emit(`JNE( ${label} );`);
            if (op === '!=') this.emit(`JIE( ${label} );`);
            if (op === '<') this.emit(`JGE( ${label} );`);
            if (op === '>') this.emit(`JLE( ${label} );`);
            if (op === '<=') this.emit(`JGT( ${label} );`);
            if (op === '>=') this.emit(`JLT( ${label} );`);
        }
    }
}
