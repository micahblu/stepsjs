
module( "Basic", {
	setup: function() {

		var config = {

			layoutTemplate: '#steps-wrapper',

			steps: [
				{
					name: 'step-1',
					template: '#step-1',
					context: {
						title: 'Step One',
						name: 'Micah'
					}
				},
				{
					name: 'step-2',
					template: '#step-2',
					context: {
						title: 'Step Two'
					}
				},
				{
					name: 'step-3',
					template: '#step-3',
					context: {
						title: 'Step Three'
					}
				}
			],

			subscriptions: {
				congratulate: $.steps.bind(function(data){
					alert('Great job, keep up the pace');
				}).to(['onBeforeLoadNext'])
			}
		};
		
		$("#steps").steps(config);

		// config vars
		this.container = $('#steps');
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

 	// Ensure all but the first panel are locked
	this.container.children('.panel').each(function(index){
		if(index > 0 ){
			equal($(this).hasClass('locked'), true, 'Panel Number ' + (index+1) + ' is locked');
		}
	});

	// Does the next panel load without validating?
	this.nextButton.trigger(this.clickEvent);

	// Since no input has been added the next button should not load the next panel
	equal(this.container.children('.panel').first().next().hasClass('locked'), true, 'Next panel successfully remained locked after clicking next');

});