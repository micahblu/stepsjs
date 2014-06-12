
module( "Basic", {
	setup: function() {
		var setup = {

		stepsTemplate: '#steps-wrapper',

		steps: [
			{
				title: 'Step One',
				name: 'step-1',
				template: '#step-1'
			},
			{
				title: 'Step Two',
				name: 'step-2',
				template: '#step-2'
			},
			{
				title: 'Step Three',
				name: 'step-3',
				template: '#step-3'
			}
		]
	};

	$("#steps").steps(setup);

	// setup vars
	this.container = $('.steps-container');
		this.nextButton = $('.next-step');
		this.clickEvent = $.Event('click');
	},
	teardown: function() {
	// clean up after each test
	}
});

test("Basic", function(){

	// Did the plugin successfully insert into the DOM ?
 	equal(this.container.length, '1', 'Steps inserted to DOM');

 	this.nextButton.trigger(this.clickEvent);

	this.container.children('.panel').each(function(index){
		if(index > 0 ){
			equal($(this).hasClass('locked'), true, 'Panel Number ' + (index+1) + ' is locked');
		}
	});
});