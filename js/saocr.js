function CRChara(options, canvas, callback) {
	this.options = $.extend({"weapon":$('#weaponList').val(),"gender":'m'}, options);
	this.lastFrameTime = Date.now() / 1000;
	this.mvp = new spine.webgl.Matrix4();
	this.skeletons = {};
	this.activeSkeleton = "";
	/*this.weapons = new Array("gulid", "blade01", "blade02", "bow01", "double01", "gun01",
			"knife01", "pole01", "pole02", "rifle01", "shield01",
			"shield02", "sword01", "sword02",
			"f_blade01", "f_blade02", "f_bow01", "f_double01",
			"f_knife01", "f_pole01", "f_pole02", "f_shield01",
			"f_shield02", "f_sword01", "f_sword02");*/
	this.animations = new Object();
	this.animations.idle = new Object();
	this.animations.click = new Object();
	this.animations.idle.male = new Array("man_stand_A","man_stand_B","man_stand_C");
	this.animations.idle.female = new Array("woman_stand_A","woman_stand_B","woman_stand_C","woman_stand_D");
	this.animations.click.male = new Array("man_click_A","man_click_B","man_click_C","man_click_D","man_click_E");
	this.animations.click.female = new Array("woman_click_A","woman_click_B","woman_click_C","woman_click_D");
	this.animations.common = new Array("walking_A");
	this.callback = callback;
	this.stop = false;
	
	this.init = function() {
		//if (this.options.id == undefined) return;
		this.activeSkeleton = this.options.id;
		if (this.options.weapon == "gulid"){
			if (this.options.gender.toUpperCase() == "F"){
				if (isdesktop){
					this.animations.idle = this.animations.common.concat(this.animations.idle.female);
				}else{
					this.animations.idle = this.animations.idle.female;
				}
				this.animations.click = this.animations.click.female;
			}else{
				if (isdesktop){
					this.animations.idle = this.animations.common.concat(this.animations.idle.male);
				}else{
					this.animations.idle = this.animations.idle.male;
				}
				this.animations.click = this.animations.click.male;
			}
		}else if (this.options.weapon.startsWith('m_')){
			this.animations.idle = new Array(this.options.weapon+'_ready');
		}
		
		// Setup this.canvas[0] and WebGL context. We pass alpha: false to this.canvas[0].getContext() so we don't use premultiplied alpha when
		// loading textures. That is handled separately by PolygonBatcher.
		this.canvas = canvas;
		//this.canvas[0].width = window.innerWidth;
		//this.canvas[0].height = window.innerHeight;
		var config = { alpha: true };
		this.gl = this.canvas[0].getContext("webgl", config) || this.canvas[0].getContext("experimental-webgl", config);	
		
		// Create a simple this.shader, mesh, model-view-projection matrix and this.skeletonRenderer.
		this.shader = spine.webgl.Shader.newTwoColoredTextured(this.gl);
		this.batcher = new spine.webgl.PolygonBatcher(this.gl);
		this.mvp.ortho2d(0, 0, this.canvas[0].width - 1, this.canvas[0].height - 1);
		this.skeletonRenderer = new spine.webgl.SkeletonRenderer(this.gl);
		this.debugRenderer = new spine.webgl.SkeletonDebugRenderer(this.gl);
		this.debugRenderer.drawRegionAttachments = false;
		this.debugRenderer.drawBoundingBoxes = false;
		this.debugRenderer.drawMeshHull = false;
		this.debugRenderer.drawMeshTriangles = false;
		this.debugRenderer.drawPaths = false;
		this.debugShader = spine.webgl.Shader.newColored(this.gl);
		this.shapes = new spine.webgl.ShapeRenderer(this.gl);
		this.assetManager = new spine.webgl.AssetManager(this.gl);
	
		// Tell this.assetManager to load the resources for each model, including the exported .json file, the .atlas file and the .png
		// file for the atlas. We then wait until all resources are loaded in the load() method.
		/*this.assetManager.loadTexture("assets/"+this.options.id+"/atlas.png");*/
		if (this.options.slice != undefined && this.options.slice != ""){
			this.assetManager.loadTexture("assets/"+this.options.slice+"/atlas.png");
			this.assetManager.loadTexture("assets/"+this.options.id+"/atlas.png");
			this.assetManager.loadText("assets/slice/"+this.options.slice+".txt");
			this.assetManager.loadText("assets/"+this.options.id+"/atlas.txt");
		}else{
			this.assetManager.loadTexture("assets/"+this.options.id+"/atlas.png");
			this.assetManager.loadText("assets/"+this.options.id+"/atlas.txt");
		}
		this.assetManager.loadText("assets/"+this.options.weapon+".json");
		
		window.requestAnimationFrame(this.load.bind(this));
		return this;
	}
	
	this.load = function () {
		// Wait until the this.assetManager has loaded all resources, then load the this.skeletons.
		if (this.assetManager.isLoadingComplete()) {
			this.skeletons[this.options.id] = this.loadSkeleton(this.options.id, "", true);
			this.setupUI();
			window.requestAnimationFrame(this.render.bind(this));
			this.callback();
			refreshcanvasbackground(this.options.id, this.canvas);
		} else {
			window.requestAnimationFrame(this.load.bind(this));
		}
	}
	
	this.getRandomAnimation = function(type){
		if (this.options.weapon == "gulid"){
			if (type == 'click'){
				return (this.animations.click[Math.floor(Math.random()*this.animations.click.length)]);
			}else{
				if (isdesktop){
					try{switch (Math.floor(Math.random()*6)){
						case 2:case 4: this.skeletons[this.activeSkeleton].skeleton.flipX = false;break;
						case 5: this.skeletons[this.activeSkeleton].skeleton.flipX = true;break;
					}}catch(err){}
				}
				return (this.animations.idle[Math.floor(Math.random()*this.animations.idle.length)]);
			}
		}else if (this.options.weapon.startsWith('m_')){
			return (this.animations.idle[Math.floor(Math.random()*this.animations.idle.length)]);
		}else{
			var skeleton = this.skeletons[this.activeSkeleton].skeleton;
			return (skeleton.data.animations[Math.floor(Math.random()*skeleton.data.animations.length)].name);
		}
	}
	
	this.loadSkeleton = function(name, initialAnimation, premultipliedAlpha, skin) {
		var CRObj = this;
		
		if (skin === undefined) skin = "default";
	
		// Load the texture atlas using name.atlas and name.png from the this.assetManager.
		// The function passed to TextureAtlas is used to resolve relative paths.
		if (this.options.slice != undefined && this.options.slice != ""){
			atlas = new spine.TextureAtlas(
					new Array(this.assetManager.get("assets/slice/"+this.options.slice+".txt"),
							this.assetManager.get("assets/"+this.options.id+"/atlas.txt")), function(path) {
				if (path.indexOf('/')>0){
					return CRObj.assetManager.get("assets/" + path);
				}else{
					return CRObj.assetManager.get("assets/" + name + "/" + path);
				}
			});
		}else{
			atlas = new spine.TextureAtlas(this.assetManager.get("assets/" + name + "/atlas.txt"), function(path) {
				return CRObj.assetManager.get("assets/" + name + "/" + path);
			});
		}
	
		// Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
		atlasLoader = new spine.AtlasAttachmentLoader(atlas);
	
		// Create a SkeletonJson instance for parsing the .json file.
		var skeletonJson = new spine.SkeletonJson(atlasLoader);
		
		// Set the scale to apply during parsing, parse the file, and create a new skeleton.	
		var skeletonData = skeletonJson.readSkeletonData(this.assetManager.get("assets/" + this.options.weapon + ".json"));
		var skeleton = new spine.Skeleton(skeletonData);
		skeleton.setSkinByName(skin);
		var bounds = this.calculateBounds(skeleton);	
	
		// Create an AnimationState, and set the initial animation in looping mode.
		var animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
		if (this.options.weapon == "gulid" || this.options.weapon.startsWith('m_')){
			initialAnimation = this.getRandomAnimation();
		}else{
			initialAnimation = skeleton.data.animations[Math.floor(Math.random()*skeleton.data.animations.length)].name;
		}
		animationState.setAnimation(0, initialAnimation, true);
		animationState.addListener({
			event: function(trackIndex, event) {
				// console.log("Event on track " + trackIndex + ": " + JSON.stringify(event));
			},
			complete: function(trackIndex, loopCount) {
				// console.log("Animation on track " + trackIndex + " completed, loop count: " + loopCount);
				//TODO
				var state = CRObj.skeletons[CRObj.activeSkeleton].state;
				var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
				var animationName = CRObj.getRandomAnimation();
				//skeleton.setToSetupPose();
				state.setAnimation(0, animationName, true);
			},
			start: function(trackIndex) {
				// console.log("Animation on track " + trackIndex + " started");
			},
			end: function(trackIndex) {
				// console.log("Animation on track " + trackIndex + " ended");
			}
		})
	
		// Pack everything up and return to caller.
		return { skeleton: skeleton, state: animationState, bounds: bounds, premultipliedAlpha: premultipliedAlpha };
	}
	
	this.calculateBounds = function(skeleton) {	
		skeleton.setToSetupPose();
		skeleton.updateWorldTransform();
		var offset = new spine.Vector2();
		var size = new spine.Vector2();
		skeleton.getBounds(offset, size, []);
		return { offset: offset, size: size };
	}
	
	this.setupUI = function () {
		var CRObj = this;
		canvas.click(function(){
			if (CRObj.options.weapon.startsWith('m_')){return;}
			var state = CRObj.skeletons[CRObj.activeSkeleton].state;
			var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
			var animationName = CRObj.getRandomAnimation('click');
			skeleton.setToSetupPose();
			state.setAnimation(0, animationName, CRObj.options.weapon != "gulid");
		})
		/*var skeletonList = $("#skeletonList");
		skeletonList.empty();
		for (var skeletonName in this.skeletons) {
			var option = $("<option></option>");
			option.attr("value", skeletonName).text(skeletonName);
			if (skeletonName === this.activeSkeleton) option.attr("selected", "selected");
			skeletonList.append(option);
		}*/
		var setupAnimationUI = function() {
			var animationList = $("#animationList");
			if (animationList == undefined){return;}
			
			animationList.empty().unbind();
			var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
			var state = CRObj.skeletons[CRObj.activeSkeleton].state;
			var activeAnimation = state.tracks[0].animation.name;
			for (var i = 0; i < skeleton.data.animations.length; i++) {
				var name = skeleton.data.animations[i].name;
				var option = $("<option></option>");
				option.attr("value", name).text(name);
				if (name === activeAnimation) option.attr("selected", "selected");
				animationList.append(option);
			}
	
			animationList.change(function() {
				var state = CRObj.skeletons[CRObj.activeSkeleton].state;
				var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
				var animationName = $("#animationList option:selected").text();
				skeleton.setToSetupPose();
				state.setAnimation(0, animationName, true);			
			})
		}
	
		/*var setupSkinUI = function() {
			var skinList = $("#skinList");
			skinList.empty();
			var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
			var activeSkin = skeleton.skin == null ? "default" : skeleton.skin.name;
			for (var i = 0; i < skeleton.data.skins.length; i++) {
				var name = skeleton.data.skins[i].name;
				var option = $("<option></option>");
				option.attr("value", name).text(name);
				if (name === activeSkin) option.attr("selected", "selected");
				skinList.append(option);
			}
	
			skinList.change(function() {			
				var skeleton = CRObj.skeletons[CRObj.activeSkeleton].skeleton;
				var skinName = $("#skinList option:selected").text();
				skeleton.setSkinByName(skinName);
				skeleton.setSlotsToSetupPose();
			})
		}*/
	
		/*skeletonList.change(function() {
			CRObj.activeSkeleton = $("#skeletonList option:selected").text();
			setupAnimationUI();
			setupSkinUI();
		})*/
		setupAnimationUI();
//		setupSkinUI();
	}
	
	this.render = function() {
		if (this.canvas.css("display")==="none"){return;}
		
		var now = Date.now() / 1000;
		var delta = now - this.lastFrameTime;
		this.lastFrameTime = now;
	
		// Update the this.mvp matrix to adjust for this.canvas[0] size changes
		this.resize();
	
		this.gl.clearColor(0, 0, 0, 0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	
		// Apply the animation state based on the delta time.
		var state = this.skeletons[this.activeSkeleton].state;
		var skeleton = this.skeletons[this.activeSkeleton].skeleton;
		var premultipliedAlpha = this.skeletons[this.activeSkeleton].premultipliedAlpha;
		state.update(delta);
		state.apply(skeleton);
		skeleton.updateWorldTransform();
	
		// Bind the this.shader and set the texture and model-view-projection matrix.
		this.shader.bind();
		this.shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
		this.shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);
	
		// Start the batch and tell the this.skeletonRenderer to render the active skeleton.
		this.batcher.begin(this.shader);
		this.skeletonRenderer.premultipliedAlpha = premultipliedAlpha;
		this.skeletonRenderer.draw(this.batcher, skeleton);
		this.batcher.end();
			
		this.shader.unbind();
	
		// draw debug information
		/*
		debugShader.bind();
		debugShader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, this.mvp.values);
		this.debugRenderer.premultipliedAlpha = premultipliedAlpha;
		this.shapes.begin(debugShader);
		this.debugRenderer.draw(this.shapes, skeleton);
		this.shapes.end();
		debugShader.unbind();
		*/
		if (!this.stop)
			window.requestAnimationFrame(this.render.bind(this));
	}
	
	this.resize = function () {
		var w = this.canvas[0].clientWidth;
		var h = this.canvas[0].clientHeight;
		
		var bounds = this.skeletons[this.activeSkeleton].bounds;
		if (this.canvas[0].width != w || this.canvas[0].height != h) {
			this.canvas[0].width = w;
			this.canvas[0].height = h;
		}
		
		/*
		var centerX = bounds.offset.x + bounds.size.x / 2;
		var centerY = bounds.offset.y + bounds.size.y / 2;
		var scaleX = bounds.size.x / this.canvas[0].width;
		var scaleY = bounds.size.y / this.canvas[0].height;
		var scale = Math.max(scaleX, scaleY) * 1.2;
		if (scale < 1) scale = 1;
		var width = this.canvas[0].width * scale;
		var height = this.canvas[0].height * scale;

		this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
		this.gl.viewport(0, 0, this.canvas[0].width, this.canvas[0].height);
		*/
		
		var centerX = bounds.offset.x + bounds.size.x / 2;
		var centerY = bounds.offset.y + bounds.size.y / 2;
		var scaleX = bounds.size.x / this.canvas[0].width;
		var scaleY = bounds.size.y / this.canvas[0].height;
		var scale = Math.max(scaleX, scaleY) * 1.2;
		if (scale < 0.5) scale = 0.5;
		var width = this.canvas[0].width * scale;
		var height = this.canvas[0].height * scale;
		
		if (this.skeletons[this.activeSkeleton].state.tracks[0].animation.name == "walking_A"){
			if (bounds.offset.x < -(this.canvas[0].width)){
				this.skeletons[this.activeSkeleton].skeleton.flipX=true;
			}else if(bounds.offset.x > 0){
				this.skeletons[this.activeSkeleton].skeleton.flipX=false;
			}
			
			if (this.skeletons[this.activeSkeleton].skeleton.flipX){
				bounds.offset.x += 2;
			}else{
				bounds.offset.x -= 2;
			}
		}
	
		this.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
		this.gl.viewport(0, 0, this.canvas[0].width, this.canvas[0].height);
		
		//console.log(bounds.size.x+","+bounds.offset.x+","+this.canvas[0].width);
	}
};