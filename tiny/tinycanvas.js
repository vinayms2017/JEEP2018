// Created by Vinay.M.S as a part of demonstration for the JEEP framework.
// Usable subject to MIT license

JEEP.RegisterLibrary("TinyCanvas", function(){
	let env = this.namespace.GetEnvironment();
	let Item = env.CreateRecordDef("Item", {
		x: 0,
		y: 0,
	})
	this.namespace.RegisterRecordDef("Line", {
		xa: 0,
		ya: 0,
		xb: 0,
		yb: 0,
		color: ""
	})
	this.namespace.RegisterRecordDef("Rectangle", {
		EXTENDS: [Item],
		width: 0,
		height: 0,
		fillColor: "",
		lineColor: "",
	})
	this.namespace.RegisterRecordDef("Text", {
		EXTENDS: [Item],
		content: "",
		font: "14pt Verdana",
		color: "black",
		align: "center",
	})

	this.namespace.RegisterClassDef("Painter", {
		CONSTRUCTOR: function(canvas){
			this.canvasElement = canvas || document.createElement("canvas");
			this.ctx = this.canvasElement.getContext('2d');
		},
		PUBLIC: {
			Reset: function(){
				this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
			},
			Scale: function(x, y){
				this.ctx.scale(x*.75,y*.75*.5)
			},
			DrawLine: function(line){
				if(line.color){
					this.saveProps()
					this.ctx.strokeStyle = line.color;
				}
				this.ctx.beginPath();
				this.ctx.moveTo(line.xa, line.ya)
				this.ctx.lineTo(line.xb, line.yb)
				this.ctx.stroke();
				this.ctx.closePath();
				if(line.color) 
					this.restoreProps()
			},
			DrawRectangle: function(rect){
				if(rect.fillColor || rect.lineColor) 
					this.saveProps()
				if(rect.fillColor){
					this.ctx.fillStyle = rect.fillColor;
					this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
				}
				else{
					this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
				}
				if(rect.fillColor || rect.lineColor)
				 this.restoreProps()
			},
			DrawText: function(text){
				if(text.color) 
					this.saveProps()
				this.ctx.fillStyle = text.color;
				this.ctx.textAlign = text.align;
				this.ctx.font = text.font;
				this.ctx.fillText(text.content, text.x, text.y);
				if(text.color) 
					this.restoreProps()
			},
			GetTextWidth: function(text){
				this.saveProps()
				this.ctx.textAlign = text.align;
				this.ctx.font = text.font;
				let tm = this.ctx.measureText(text.content);
				this.restoreProps()
				return tm.width;
			}
		},
		PRIVATE: {
			canvasElement__get: null,
			ctx: null,
			savedProps: {},
			savedPropNames: ["strokeStyle", "fillStyle", "textAlign", "font"],
			saveProps: function(){
				JEEP.Utils.CopyProps(this.ctx, this.savedProps, this.savedPropNames)
			},
			restoreProps: function(){
				JEEP.Utils.CopyProps(this.savedProps, this.ctx, this.savedPropNames)
			}
		}
	})
})