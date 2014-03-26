
module( "Foo", {
  setup: function() {
  	this.foo = 'bar'
  },
  teardown: function() {
    // clean up after each test
  }
});

test("Bar", function(){
  equal(this.foo, 'bar', 'got foobar baby');
});