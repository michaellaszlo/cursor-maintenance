# -*- coding: utf-8 -*-
"""A script demonstrating four approaches to maintaining cursor position.

Test -- test cases and a test runner for two formatting operations
Formatter -- implements the formatting operations without cursor maintenance
NumericalCursorFormatter -- adjusts the cursor position with ad hoc rules
TextualCursorFormatter -- includes the cursor in the string while formatting
TextWithCursor -- implements basic string operations with cursor maintenance
MetaCursorFormatter -- formats TextWithCursor objects instead of strings
Distance -- implements several measures of string distance
RetrospectiveCursorFormatter -- repositions the cursor using distance functions
Utilities -- functions to choose a cursor and tally character frequencies
"""


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
            ('1,00', 2, '100', 1),
            ('1234', 1, '1,234', 1),
            ('1,0234', 3, '10,234', 2),
            ('1,00000', 4, '100,000', 3),
            ('1,00000', 5, '100,000', 5),
            ('120,3456', 3, '1,203,456', 4),
            ('123,0456', 5, '1,230,456', 5),
            ('10,00', 1, '1,000', 1),
            ('10,00', 2, '1,000', 3),
            ('10,00', 3, '1,000', 3),
            ('10,00', 4, '1,000', 4),
            ('129,00', 3, '12,900', 4),
            ('900', 0, '900', 0),
            (',900', 1, '900', 0),
            ('123,900', 0, '123,900', 0),
            (',123,900', 0, '123,900', 0)
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
        """Store an object that implements formatting operations."""
        self.formatter = formatter

    def show_text(self, label, text, cursor=None):
        """Print out a test string, optionally with cursor position."""
        prefix = '   %s: "' % label
        print('%s%s"' % (prefix, text))
        if cursor != None:
            print((len(prefix) + cursor) * ' ' + '↖ %d' % cursor)

    def text_markup(self, text, cursor=None):
        if cursor != None:
            text = text[:cursor] + '^' + text[cursor:]
        return '"%s"' % text

    def case_markup(self, case, cursor=None):
        """Make an inline Markdown string for a test case."""
        a_text, a_cursor, b_text, b_cursor = case
        a_markup = self.text_markup(a_text, a_cursor)
        b_markup = self.text_markup(b_text, b_cursor)
        return '  %s -> %s' % (a_markup, b_markup)

    def display(self, name=None, with_cursor=True, compact=False):
        """Print out the test pairs for one or all formatting operations."""
        if name == None:
            print('')
            for name in sorted(self.test_data.keys()):
                self.display(name, with_cursor, compact)
            return
        print('Test cases for %s\n' % name)
        cases = self.test_data[name]
        if compact:
            for case in cases:
                print(self.case_markup(case))
            print('')
            return
        for (original_text, original_cursor,
                expected_text, expected_cursor) in cases:
            if not with_cursor:
                original_cursor, expected_cursor = None, None
            self.show_text('original', original_text, original_cursor)
            self.show_text('expected', expected_text, expected_cursor)
            print('')

    def run(self, name=None, with_cursor=True):
        """Process the test cases for one or all formatting operations."""
        if name == None:
            print('')
            for name in sorted(self.test_data.keys()):
                self.run(name, with_cursor)
                print('')
            return
        print('Testing %s' % name)
        operation = getattr(self.formatter, name)
        passing = True
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
                passing = False
        if passing:
            print('passed')
        return passing


class Formatter:
    """Implements formatting operations without moving the cursor."""
    
    def commatize(self, s, cursor=None):
        """Distribute commas to separate digits into groups of three."""
        s = s.replace(',', '')
        start = len(s) % 3 or 3
        groups = [ s[:start] ]
        for i in range(start, len(s), 3):
            groups.append(s[i : i + 3])
        s = ','.join(groups)
        return (s, cursor)

    def trimify(self, s, cursor=None):
        """Trim spaces around the string and condense internal spaces."""
        s = s.strip()
        s = re.sub('[ ]+', ' ', s)
        return (s, cursor)


class NumericalCursorFormatter(Formatter):
    """Moves the cursor with ad hoc rules for each formatting operation."""

    def commatize(self, s, cursor):
        """Position the cursor by counting digits to its left."""
        left_digit_count = cursor - s[:cursor].count(',')
        s = Formatter.commatize(self, s)[0]
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
        """Adjust the cursor by counting spaces to its left."""
        left_trimmed = Formatter.trimify(self, s[:cursor] + '|')[0]
        s = Formatter.trimify(self, s)[0]
        cursor = min(len(s), len(left_trimmed) - 1)
        return (s, cursor)


class TextualCursorFormatter(Formatter):
    """Represents the cursor with a character while formatting the string."""

    def commatize(self, s, cursor):
        """Scan from right to left, counting only digit characters."""
        cursor_char = Utilities.choose_cursor_char(s)
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
        """Trimify the string normally and fix spaces around the cursor."""
        cursor_char = Utilities.choose_cursor_char(s)
        s = s[:cursor] + cursor_char + s[cursor:]
        s = Formatter.trimify(self, s)[0]
        s = s.replace(' ' + cursor_char + ' ', ' ' + cursor_char)
        if s[0] == cursor_char:
            s = s.replace(cursor_char + ' ', cursor_char)
        elif s[-1] == cursor_char:
            s = s.replace(' ' + cursor_char, cursor_char)
        cursor = s.index(cursor_char)
        s = s.replace(cursor_char, '')
        return (s, cursor)


class TextWithCursor:
    """Implements general-purpose string operations on text with a cursor.

    The essential string operations are read, insert, and delete.
    For convenience, we also provide length, append, and display.
    """

    def __init__(self, text='', cursor=0):
        """Store a string for the text and an integer for the cursor."""
        self.text = text
        self.cursor = cursor

    def read(self, begin, length=1):
        """Starting from a text position, read one or more characters."""
        return self.text[begin : begin + length]

    def insert(self, begin, subtext):
        """Starting at a text position, insert a string.
        
        The cursor is unaffected if it is exactly at the insertion point or
        to the left of the insertion point. If the cursor is to the right of
        the insertion point, it gets shifted further to the right by the
        length of the inserted string.
        """
        self.text = self.text[:begin] + subtext + self.text[begin:]
        if self.cursor > begin:
            self.cursor += len(subtext)

    def delete(self, begin, length=1):
        """Starting from a text position, delete one or more characters.
        
        The cursor is unaffected if it is to the left of the first deleted
        character. Otherwise, the cursor is shifted to the left by the
        number of deleted characters that lie to the left of it.
        """
        self.text = self.text[:begin] + self.text[begin + length : ]
        if self.cursor > begin:
            self.cursor -= min(self.cursor - begin, length)

    def length(self):
        """Return the length of the text. The cursor has zero width."""
        return len(self.text)

    def append(self, subtext):
        """Insert a string at the end of the text.
        
        This method does not move the cursor to the end of the text. It does
        not modify the cursor position at all.
        """
        self.insert(self.length(), subtext)

    def display(self, with_cursor=True):
        """Display the string and, by default, the cursor below it.

        The cursor character is a Unicode northwest arrow. It points toward
        the upper left corner of its containing rectangle. When this arrow
        is printed below a text character, it reminds us that the cursor is
        to the immediate left of the character. In other words, the cursor
        lies between the current character and the preceding character.
        """
        print(self.text)
        if with_cursor:
            print(self.cursor * ' ' + '↖')


class MetaCursorFormatter:
    """Applies formatting operations to TextWithCursor objects, not strings."""

    def commatize(self, s, cursor):
        """Go from right to left, counting digits and inserting commas.

        Extraneous commas are deleted along the way. Cursor maintenance is
        handled by the TextWithCursor object.
        """
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
        """Condense internal space sequences and trim around the text."""
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


class Distance:
    """Implements measures of string distance."""

    def levenshtein(s, t):
        """Measure the Levenshtein distance between two strings."""
        n, m = len(s), len(t)
        if min(n, m) == 0:
            return max(n, m)
        current = list(range(m + 1))
        previous = (m + 1) * [ None ]
        for i in range(1, n + 1):
            current, previous = previous, current
            current[0] = previous[0] + 1
            for j in range(1, m + 1):
                if t[j - 1] == s[i - 1]:
                    current[j] = previous[j - 1]
                else:
                    current[j] = min(previous[j - 1] + 1,
                                     previous[j] + 1,
                                     current[j - 1] + 1)
        return current[m]
    levenshtein = staticmethod(levenshtein)

    def split_levenshtein(s, s_cursor, t, t_cursor):
        """Split each string and sum the respective Levenshtein distances.

        The Levenshtein distance between the substrings to the left of each
        cursor is added to the Levenshtein distance between the substrings
        to the right of each cursor.
        """
        cursor_char = Utilities.choose_cursor_char(s + t)
        left = Distance.levenshtein(s[:s_cursor], t[:t_cursor])
        right = Distance.levenshtein(s[s_cursor:], t[t_cursor:])
        return left + right
    split_levenshtein = staticmethod(split_levenshtein)

    def split_counts(s, cursor, chars):
        """Split the string and get character frequencies for each side."""
        count_left = Utilities.get_counts(s[:cursor], chars)
        count_right = Utilities.get_counts(s[cursor:], chars)
        return count_left, count_right
    split_counts = staticmethod(split_counts)

    def balance_frequencies(s, s_cursor, t, t_cursor):
        """Sum the squares of the differences in character distribution ratios.

        Only characters that occur in each string at least once are counted.
        The distribution ratio of a character is the number of times it occurs
        to the left of the cursor divided by the number of times it occurs in
        the whole string.
        """
        chars = set(list(s)).intersection(set(list(t)))
        s_count_left, s_count_right = Distance.split_counts(s, s_cursor, chars)
        t_count_left, t_count_right = Distance.split_counts(t, t_cursor, chars)
        cost = 0
        for ch in chars:
            a = 1.0 * s_count_left[ch] / (s_count_left[ch] + s_count_right[ch])
            b = 1.0 * t_count_left[ch] / (t_count_left[ch] + t_count_right[ch])
            cost += abs(a - b) ** 2
        return cost
    balance_frequencies = staticmethod(balance_frequencies)


class RetrospectiveCursorFormatter(Formatter):
    """Uses string distance to calculate a cursor position after formatting."""

    def __init__(self, get_distance):
        """Store a function that measures string distance (with cursors).
        
        The distance function takes four arguments: a string followed by its
        cursor position, then another string and its cursor position. The
        function returns a floating-point value representing the distance
        from the first string with cursor to the second string with cursor.
        """
        self.get_distance = get_distance

    def adjust_cursor(self, original, cursor, formatting_method):
        """Apply a formatting operation, then adjust the cursor position.

        We are given a string and a cursor position. We apply some formatting
        operation to obtain a new string. We choose a new cursor position that
        minimizes the distance from the original string with cursor to the
        formatted string with cursor.
        """
        formatted = formatting_method(self, original)[0]
        cursor_char = Utilities.choose_cursor_char(original + formatted)
        get_distance = self.get_distance
        best_cost = get_distance(original, cursor, formatted, 0)
        best_pos = 0
        #print(original[:cursor] + '^' + original[cursor:])
        #print('  ^%s %d' % (formatted, best_cost))
        for pos in range(1, len(formatted) + 1):
            cost = get_distance(original, cursor, formatted, pos) 
            #print('  %s^%s %f' % (formatted[:pos], formatted[pos:], cost))
            if cost < best_cost:
                best_cost = cost
                best_pos = pos
        return (formatted, best_pos)

    def commatize(self, original, cursor):
        """Pass the cursorless commatize function to adjust_cursor."""
        return self.adjust_cursor(original, cursor, Formatter.commatize)

    def trimify(self, original, cursor):
        """Pass the cursorless trimify function to adjust_cursor."""
        return self.adjust_cursor(original, cursor, Formatter.trimify)


class Utilities:
    """Methods for choosing a cursor character and counting characters."""

    def choose_cursor_char(s):
        """Return a printable ASCII character not found in the given string.

        We prioritize a hard-coded set of characters. If all occur in the
        string, we try each character with code 32 through 126, inclusive.
        If all of them occur, we give up and return None.
        """
        used_chars = set(list(s))
        for ch in '|^_#':
            if ch not in used_chars:
                return ch
        for code in range(32, 127):
            ch = chr(code)
            if ch not in used_chars:
                return ch
        return None
    choose_cursor_char = staticmethod(choose_cursor_char)

    def get_counts(s, chars):
        """In a given string, count the frequencies of the given characters."""
        counts = { ch: 0 for ch in chars }
        for ch in s:
            if ch in chars:
                counts[ch] += 1
        return counts
    get_counts = staticmethod(get_counts)


if __name__ == '__main__':
    #Test().display('commatize')
    #Test().display(compact=True)
    #Test(Formatter()).run('commatize', with_cursor=False)
    #Test(NumericalCursorFormatter()).run()
    Test(TextualCursorFormatter()).run('commatize')
    #Test(MetaCursorFormatter()).run()
    #Test(RetrospectiveCursorFormatter(Distance.split_levenshtein)).run()
    #Test(RetrospectiveCursorFormatter(Distance.balance_frequencies)).run()

