# -*- coding: utf-8 -*-

import re


class Test:
    """Describes the behavior of a fixed set of formatting operations.
    Provides test data and a test runner that can be used to verify
    the formatting operations with or without cursor positioning.
    """

    test_data = {
        'commatize': [
            ('2500', 1, '2,500', 1),
            ('12500', 3, '12,500', 4),
            ('5,4990000', 9, '54,990,000', 10),
            (',1,,8,,,', 3, '18', 1),
            ('1,0,0,000', 3, '100,000', 2),
            ('1,0,000', 2, '10,000', 1),
            ('1,,000', 2, '1,000', 1),
            ('1,00', 2, '100', 1)
        ],
        'trimify': [
            ('  hello  ', 8, 'hello', 5),
            ('  hello  ', 1, 'hello', 0),
            ('Hello,  friends.', 7, 'Hello, friends.', 7),
            ('Hello,  friends.', 8, 'Hello, friends.', 7),
            ('  whirled    peas  now  ', 9, 'whirled peas now', 7),
            ('  whirled    peas  now  ', 10, 'whirled peas now', 8),
            ('  whirled    peas  now  ', 11, 'whirled peas now', 8),
            ('  whirled    peas  now  ', 12, 'whirled peas now', 8),
            ('  whirled    peas  now  ', 13, 'whirled peas now', 8),
            ('     ', 3, '', 0)
        ]
    }

    def __init__(self, formatter=None):
        """Takes an object that implements the formatting operations described
        by our test data.
        """
        self.formatter = formatter

    def show_text(self, label, text, cursor=None):
        """Prints out a single test string, optionally with cursor position.
        """
        prefix = '   %s: "' % label
        print('%s%s"' % (prefix, text))
        if cursor != None:
            print((len(prefix) + cursor) * ' ' + '↖ %d' % cursor)

    def display(self, name, show_cursor=True):
        """Prints out the test pairs for a specified formatting operation.
        """
        print('Test cases for %s\n' % name)
        for (original_text, original_cursor,
                expected_text, expected_cursor) in self.test_data[name]:
            if not show_cursor:
                original_cursor, expected_cursor = None, None
            self.show_text('original', original_text, original_cursor)
            self.show_text('expected', expected_text, expected_cursor)
            print('')

    def display_all(self, show_cursor=True):
        """Displays the test pairs for every formatting operation.
        """
        print('')
        for name in self.test_data.keys():
            self.display(name, show_cursor)

    def run(self, name, with_cursor=True):
        """Tests the specified formatting operation.
        """
        print('Testing %s' % name)
        operation = getattr(self.formatter, name)
        success = True
        for (original_text, original_cursor,
                expected_text, expected_cursor) in self.test_data[name]:
            received_text, received_cursor = operation(
                    original_text, original_cursor)
            if received_text != expected_text or (with_cursor and
                    received_cursor != expected_cursor):
                print('failed')
                self.show_text('original', original_text, original_cursor)
                self.show_text('expected', expected_text, expected_cursor)
                self.show_text('received', received_text, received_cursor)
                success = False
        if success:
            print('passed')
        return success

    def run_all(self, with_cursor=True):
        """Tests all formatting operations.
        """
        print('')
        for name in self.test_data.keys():
            self.run(name, with_cursor)
            print('')


class Formatter:
    """Implements the operations specified in the Test class without
    regard for cursor position.
    """
    
    def commatize(self, s, cursor=None):
        """Takes a string of digits and commas. Adjusts commas so that they
        separate the digits into groups of three.
        """
        s = s.replace(',', '')
        start = len(s) % 3 or 3
        groups = [ s[:start] ]
        for i in range(start, len(s), 3):
            groups.append(s[i:i+3])
        s = ','.join(groups)
        return (s, cursor)

    def trimify(self, s, cursor=None):
        """Removes spaces from the beginning and end of the string, and
        reduces each internal whitespace sequence to a single space.
        """
        s = s.strip()
        s = re.sub('\s+', ' ', s)
        return (s, cursor)


class NumericalCursorFormatter:

    def commatize(self, s, cursor):
        offset_before = s[:cursor].count(',')
        left_digit_count = cursor - s[:cursor].count(',')
        s = Formatter().commatize(s)[0]
        if left_digit_count == 0:
            return (s, 0)
        for pos, ch in enumerate(s):
            if ch != ',':
                left_digit_count -= 1
                if left_digit_count == 0:
                    break
        cursor = pos + 1
        return (s, cursor)

    def trimify(self, s, cursor):
        left = s[:cursor]
        left_trimmed = Formatter().trimify(left + 'x')[0][:-1]
        left_whitespace_count = cursor - len(left_trimmed)
        s = Formatter().trimify(s)[0]
        cursor = min(len(s), cursor - left_whitespace_count)
        return (s, cursor)


class TextualCursorFormatter:

    def commatize(self, s, cursor):
        cursor_char = '^'
        s = s[:cursor] + cursor_char + s[cursor:]
        groups = []
        group_chars = []
        digit_count = 0
        for ch in reversed(s):
            if ch != ',':
                group_chars.append(ch)
                if ch != cursor_char:
                    digit_count += 1
                    if digit_count == 3:
                        groups.append(''.join(reversed(group_chars)))
                        group_chars = []
                        digit_count = 0
        if group_chars != []:
            groups.append(''.join(reversed(group_chars)))
        s = ','.join(reversed(groups))
        cursor = s.index(cursor_char)
        s = s.replace(cursor_char, '')
        return (s, cursor)

    def trimify(self, s, cursor):
        cursor_char = '^'
        s = s[:cursor] + cursor_char + s[cursor:]
        s = Formatter().trimify(s)[0]
        s = s.replace(' ' + cursor_char + ' ', ' ' + cursor_char)
        if s[0] == cursor_char:
            s = s.replace(cursor_char + ' ', cursor_char)
        elif s[-1] == cursor_char:
            s = s.replace(' ' + cursor_char, cursor_char)
        cursor = s.index(cursor_char)
        s = s.replace(cursor_char, '')
        return (s, cursor)


class TextWithCursor:

    def __init__(self, text='', cursor=0):
        self.text = text
        self.cursor = cursor

    def read(self, begin, length=1):
        return self.text[begin : begin + length]

    def insert(self, begin, subtext):
        self.text = self.text[:begin] + subtext + self.text[begin:]
        if self.cursor > begin:
            self.cursor += len(subtext)

    def delete(self, begin, length=1):
        self.text = self.text[:begin] + self.text[begin + length : ]
        if self.cursor >= begin:
            self.cursor -= min(self.cursor - begin, length)

    def length(self):
        return len(self.text)

    def append(self, subtext):
        self.insert(self.length(), subtext)

    def display(self):
        print(self.text)
        print(self.cursor * ' ' + '↖')


class MetaCursorFormatter:

    def commatize(self, s, cursor):
        t = TextWithCursor(s, cursor)
        digit_count = 0
        for pos in reversed(range(t.length())):
            if t.read(pos) == ',':
                t.delete(pos)
            elif digit_count < 2:
                digit_count += 1
            elif pos > 0:
                t.insert(pos, ',')
                digit_count = 0
        return (t.text, t.cursor)

    def trimify(self, s, cursor):
        t = TextWithCursor(s, cursor)
        space_count = 0
        for pos in reversed(range(t.length())):
            if t.read(pos) != ' ':
                space_count = 0
            elif space_count == 0:
                space_count = 1
            else:
                t.delete(pos + 1)
        for pos in [ t.length() - 1, 0 ]:
            if t.read(pos) == ' ':
                t.delete(pos)
        return (t.text, t.cursor)


class RetrospectiveCursorFormatter:

    def commatize(self, s, cursor):
        return ('', None)

    def trimify(self, s, cursor):
        return ('', None)


if __name__ == '__main__':
    Test().display_all()
    Test(MetaCursorFormatter()).run_all()

