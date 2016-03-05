# -*- coding: utf-8 -*-

import re


class Test:
    """Describes the behavior of a fixed set of formatting operations.
    Provides test data and testing functionality that can be used to validate
    the formatting operations with or without cursor positioning.
    """

    test_cases = {
        'commatize': [
            ('24875', 2, '24,875', 3),
            ('5,4990000', 9, '54,990,000', 10),
            (',1,,8,,,', 3, '18', 1)
        ],
        'trim': [
            ('hello ', 6, 'hello', 5),
            ('   Hello,   friends.   ', 12, 'Hello,   friends.', 9),
            ('   ', 1, '', 0)
        ],
        'shrink': [
            ('whirled    peas', 11, 'whirled peas', 8),
            ('    Hello  there.  Hi.  ', 17, ' Hello there. Hi. ', 13),
            ('    ', 4, ' ', 1)
        ]
    }

    def __init__(self, formatter):
        """Takes an object that implements the formatting operations described
        by our test data.
        """
        names = [ 'commatize', 'trim', 'shrink' ]
        self.tests = [ (name, getattr(formatter, name), self.test_cases[name])
                for name in names ]

    def show_all_tests(self, with_cursor=False):
        """Prints out the test data without running any tests.
        """
        print('')
        for name, operation, data_set in self.tests:
            print('Tests for %s:\n' % (name))
            for (original_text, original_cursor,
                    expected_text, expected_cursor) in data_set:
                if not with_cursor:
                    original_cursor, expected_cursor = None, None
                self.show_text('original', original_text, original_cursor)
                self.show_text('expected', expected_text, expected_cursor)
                print('')

    def show_text(self, label, text, cursor=None):
        """Prints out a piece of test data, optionally showing a cursor.
        """
        prefix = '   %s: "' % label
        print('%s%s"' % (prefix, text))
        if cursor != None:
            print((len(prefix) + cursor) * ' ' + '↖ %d' % cursor)

    def run_tests(self, with_cursor=False):
        """Applies the specified formatting operations to all the test data.
        """
        success = True
        for name, operation, data_set in self.tests:
            for (original_text, original_cursor,
                    expected_text, expected_cursor) in data_set:
                if with_cursor:
                    received_text, received_cursor = operation(
                            original_text, original_cursor)
                else:
                    received_text = operation(original_text)
                    original_cursor = received_cursor = expected_cursor = None
                if received_text != expected_text or (with_cursor and
                        received_cursor != expected_cursor):
                    print('Failed %s:' % name)
                    self.show_text('original', original_text, original_cursor)
                    self.show_text('received', received_text, received_cursor)
                    self.show_text('expected', expected_text, expected_cursor)
                    success = False
        if success:
            print('Tests passed.')
        return success


class CursorlessFormatter:
    """Implements the operations specified in the Test class without
    regard for cursor position. The formatting methods take only a string
    argument and return only a string.
    """
    
    def commatize(self, s):
        """Takes a string of digits and commas. Adjusts commas so that they
        separate the digits into groups of three.
        """
        s = s.replace(',', '')
        start = len(s) % 3 or 3
        groups = [ s[:start] ]
        for i in range(start, len(s), 3):
            groups.append(s[i:i+3])
        return ','.join(groups)

    def trim(self, s):
        """Removes spaces from the beginning and end of the string.
        """
        return s.strip()

    def shrink(self, s):
        """Reduces each sequence of whitespace with a single space.
        """
        return re.sub('\s+', ' ', s)


if __name__ == '__main__':
    Test(CursorlessFormatter()).show_all_tests(True)
