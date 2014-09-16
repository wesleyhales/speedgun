
/*
Unit tests that cover basic functionality of app.js.
 */

module('Member Row Construction');

//test('Build 2 Member Rows', function() {
//    expect(1);
//
//    var members = [{"email": "jane.doe@company.com", "id": 1, "name": "Jane Doe", "phoneNumber": "12312312311"},{"email": "john.doe@company.com", "id": 0, "name": "John Doe", "phoneNumber": "2125551212"}];
//
//    var html = buildMemberRows(members);
//
//    ok($(html).length == 2, 'Number of rows built: ' + length);
//});

test('Build 0 member Rows', function() {
    expect(1);

    var members = [];

    var html = buildMemberRows(members);

    ok($(html).length == 0, 'Created no rows for empty members');
});

module('Member Restful Calls');

asyncTest('Request current member list', function() {
    expect(1);

    $.ajax({
        url: "http://localhost/rest/members",
        dataType: "jsonp",
        jsonp: "jsonpcallback",
        success: function(data) {
            ok($(data).length, "Initial member returned");
            start();
        }
    });
});

test('Register a new member', function() {
    ok(1==1,"TODO");
});

test('Register a member with a duplicate email', function() {
    ok(1==1,"TODO");
});