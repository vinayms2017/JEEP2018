# JEEP

JEEP is an ambitious framework intended to impart features to JavaScript that enables robust software engineering by bringing object orientation to JavaScript beyond what is available in the language natively. With Jeep, it becomes easy to create reusable, customizable and extensible components of complex structure and behavior compared what can be done with plain JavaScript code. It is a C++ inspired framework that tries to make JavaScript look, feel and behave like C++, but fear not, it only imports the best features.  

## Features

Jeep has a host of features and they all revolve around structure and semantics. As a result, it promotes writing readable code and is very strict in enforcing a set of rules. It tries to deliver all this with minimum overhead, and sometimes with none at all. It is a complex framework, but one that is easy to use, and cannot be effectively described in a small text file such as this. Hence a 120+ page pdf document exists that discusses the framework in detail.

For simplicity, the features are reduced to these two lists

### Qualitative
* robustness
* maintainable and extensible classes
* intuitive class description
* improved productivity and performance

### Technical
* single and multiple inheritance
* constructor and destructor
* virtual and abstract functions
* development mode and production mode split

## Quick Example

The image is a screen shot of a simple demonstration application created using Jeep that helps visualize hierarchies. It shows a Mermaid class. The code follows after it. 

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

## Authors

Designed and developed by Vinay.M.S. My contact is present in the document.

## Installation

Simply include the jeep.js file as you would any other script.

## Dependency

None. Jeep is written in standard JavaScript (ES5) and contained in a single file.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details
