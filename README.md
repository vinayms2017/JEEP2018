# JEEP

**JEEP is not yet another single page application framework, neither is it yet another jQuery like library of utilities. It is deeper and philosophical, and address the nature of the JavaScript language itself.**

JEEP is an ambitious framework intended to impart features to JavaScript that enables robust software engineering by bringing object orientation to JavaScript beyond what is available in the language natively. Jeep makes it easy to create reusable, customizable and extensible components of complex structure and behavior compared what can be done with plain JavaScript code. It is a C++ inspired framework that tries to make JavaScript look, feel and behave like C++ for most part, but fear not, it only imports the best features. 

## 1. Features

Jeep has a host of features and they all revolve around structure and semantics. As a result, it promotes writing readable code and is very strict in enforcing a set of rules. It tries to deliver all this with minimum overhead, and sometimes with none at all. It is a complex framework, but one that is easy to use, and cannot be effectively described in a small text file such as this by simply mentioning a feature name accompanied by a two line throwaway code. Hence a 120+ page pdf document exists that discusses the framework in detail.

For simplicity, the features are reduced to these two lists

### 1.1. Qualitative Features
- enforces syntax and semantic rules strictly and imparts robustness to code
- promotes writing intuitive, readable and easily extensible code
- allows code to be highly structured and organized
- improves productivity and performance

### 1.2. Technical Features
- offers a range of objects to help model data and behavior appropriately
- allows member with public, protected and private access restriction
- allows member variables and functions to be constant
- allows a series of validation on functions such as argument types, count etc
- allows single and multiple inheritance with virtual and abstract functions
- provides development mode and production modes (like debug and release build)
- and much much more

## 2. Three Quick Examples

Although only classes are shown in the examples, keep in mind that there are more objects available, namely, records, structures, fields and groups.  For a more involved demonstration where a simple tool is built in a tutorial style, read ![this](https://github.com/vinayms2017/JEEP2018/blob/master/demo.md).

### 2.1. Access Restriction

``` javascript
JEEP.InitFramework();

let DemoEnv = JEEP.CreateEnvironment({
    client: "jeep-aware", 
    mode: "development-mode"
});

let Class = DemoEnv.CreateClassDef("Class", {
    PUBLIC: {
        pubval: 0,
        pubfunc: function(){
            cout("pubval:", this.pubval, "protval:", this.protval, "privval:", this.privval)
        },
    },
    PROTECTED: {
        protval: 100,
    },
    PRIVATE: {
        privval: 200,
    }
})
let c = Class.New();
c.pubfunc();
try{c.protval=0}catch(e){cout(e)}
try{c.privval=0}catch(e){cout(e)}
```

```
pubval: 0 protval: 100 privval: 200 
JEEP: Attempt to write protected variable 'Class.protval' detected. Aborting... 
JEEP aborted 
JEEP: Attempt to write private variable 'Class.privval' detected. Aborting... 
JEEP aborted
```

### 2.2. Constant Function

``` javascript
JEEP.InitFramework();

let DemoEnv = JEEP.CreateEnvironment({
    client: "jeep-aware", 
    mode: "development-mode"
});

let Class = DemoEnv.CreateClassDef("Class", {
    PUBLIC: { 
        value: 10,
        show__const: function(x){this.value = x},
        print: function(){cout("value:", this.value)}
    }
})
let c = Class.New();
try{c.show(33)}catch(e){cout(e)}
c.print();
```

```
JEEP: Attempt to change the variable 'Class.value' inside constant function detected. Call trace: [Class.show]. Aborting... 
JEEP aborted
value: 10
```

### 2.3. Multiple Inheritance

The example creates a Mermaid class as depicted in the diagram. The image is a screen shot of a simple demonstration application created using Jeep that helps visualize hierarchies.

![](https://github.com/vinayms2017/JEEP/blob/master/mermaiddemo.jpg)

``` javascript

JEEP.InitFramework();

let DemoEnv = JEEP.CreateEnvironment({
    client: "jeep-aware", 
    mode: "development-mode"
});

DemoEnv.RegisterClassDef("Animal", {
    CONSTRUCTOR: function(n){
        this.name = n;
    },
    PUBLIC: {
        liveOneMoment: function(){
            this.breathe();
            this.move();
        }
    },
    PROTECTED: {
        breathe__abstract: function(){},
        move__abstract: function(){},
    },
    PRIVATE: {
        name__get: "",
    }
})
DemoEnv.RegisterClassDef("Fish", {
    EXTENDS: ["Animal"],
    PROTECTED: {
        breathe__virtual: function(){cout(this.$name, this.getName(),"breathing through gills")},
        move__virtual: function(){cout(this.$name, this.getName(),"moving using tail fins")},
    }
})
let Human = DemoEnv.CreateClassDef("Human", {
    EXTENDS: ["Animal"],
    PROTECTED: {
        breathe__virtual: function(){cout(this.$name, this.getName(),"breathing through nose")},
        move__virtual: function(){cout(this.$name, this.getName(),"moving by walking")},
    }
})
DemoEnv.RegisterClassDef("Mermaid", {
    EXTENDS: ["Fish", Human],
    PROTECTED: {
        breathe__virtual: function(){this.$base.Human.breathe()},
        move__virtual: function(){this.$base.Fish.move()},
    }
})
let Mermaid = JEEP.GetObjectDef("Mermaid");
let m = Mermaid.New("Mermy");
m.liveOneMoment();
```

```
 Mermaid Mermy breathing through nose 
 Mermaid Mermy moving using tail fins
```

## 4. Authors

Designed and developed by Vinay.M.S. You may contact me at prefix.vinayms@gmail.com where prefix is engineer.

## 5. Installation

Simply include the jeep.js file as you would any other script.

## 6. Dependency

None. Jeep is written in standard JavaScript (ES5) and contained in a single file.

## 7. License

This project is licensed under the MIT License - see the LICENSE.md file for details
