import unittest
from datetime import date, time

from fastapi import HTTPException

from app.routers.shifts import create_shift, update_shift
from app.schemas.shift import ShiftCreate, ShiftUpdate


class FakeQuery:
    def __init__(self, database, table_name):
        self.database = database
        self.table_name = table_name
        self.filters = {}
        self.operation = "select"
        self.payload = None

    def select(self, _fields):
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = payload
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def execute(self):
        rows = self.database.get(self.table_name, [])
        matching = [
            row for row in rows
            if all(row.get(field) == value for field, value in self.filters.items())
        ]
        if self.operation == "insert":
            inserted = {**self.payload, "shift_id": "new-shift"}
            self.database[self.table_name] = rows + [inserted]
            return type("Response", (), {"data": [inserted]})()
        if self.operation == "update":
            for row in matching:
                row.update(self.payload)
            return type("Response", (), {"data": matching})()
        return type("Response", (), {"data": matching})()


class FakeDatabase:
    def __init__(self, staff=None, shifts=None):
        self.tables = {"staff": staff or [], "shifts": shifts or []}

    def table(self, table_name):
        return FakeQuery(self.tables, table_name)


class ShiftRouterTests(unittest.TestCase):
    manager = {"sub": "manager-1", "personnel_type": "manager"}
    staff = {"sub": "staff-1", "personnel_type": "staff"}

    def make_payload(self, **overrides):
        values = {
            "personnel_id": "staff-1",
            "tanggal": date(2026, 9, 23),
            "jam_mulai": time(9, 0),
            "jam_selesai": time(17, 0),
            "created_by": "manager-1",
        }
        values.update(overrides)
        return ShiftCreate(**values)

    def make_shift(self, **overrides):
        values = {
            "shift_id": "shift-1",
            "personnel_id": "staff-1",
            "status_kehadiran": "terjadwal",
        }
        values.update(overrides)
        return values

    def test_create_shift_rejects_non_staff_target(self):
        database = FakeDatabase()

        with self.assertRaises(HTTPException) as error:
            create_shift(self.make_payload(personnel_id="manager-1"), database, self.manager)

        self.assertEqual(error.exception.status_code, 400)

    def test_staff_can_confirm_own_scheduled_shift(self):
        shift = self.make_shift()
        database = FakeDatabase(shifts=[shift])

        result = update_shift(
            "shift-1",
            ShiftUpdate(status_kehadiran="hadir"),
            database,
            self.staff,
        )

        self.assertEqual(result["status_kehadiran"], "hadir")

    def test_staff_cannot_submit_alpha(self):
        database = FakeDatabase(shifts=[self.make_shift()])

        with self.assertRaises(HTTPException) as error:
            update_shift(
                "shift-1",
                ShiftUpdate(status_kehadiran="alpha"),
                database,
                self.staff,
            )

        self.assertEqual(error.exception.status_code, 403)

    def test_staff_cannot_change_recorded_attendance(self):
        database = FakeDatabase(shifts=[self.make_shift(status_kehadiran="izin")])

        with self.assertRaises(HTTPException) as error:
            update_shift(
                "shift-1",
                ShiftUpdate(status_kehadiran="hadir"),
                database,
                self.staff,
            )

        self.assertEqual(error.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
