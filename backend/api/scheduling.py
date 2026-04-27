from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from ortools.sat.python import cp_model

router = APIRouter()

class ShiftRequest(BaseModel):
    num_employees: int
    num_days: int
    num_shifts: int

@router.post("/schedule")
async def generate_schedule(req: ShiftRequest):
    """
    Generate an employee shift schedule using Google OR-Tools (CpSolver).
    Each employee gets assigned to shifts without working two consecutive shifts on the same day.
    """
    if req.num_employees <= 0 or req.num_days <= 0 or req.num_shifts <= 0:
        raise HTTPException(status_code=400, detail="Values must be greater than 0")

    model = cp_model.CpModel()

    # shifts[(e, d, s)]: employee 'e' works shift 's' on day 'd'.
    shifts = {}
    for e in range(req.num_employees):
        for d in range(req.num_days):
            for s in range(req.num_shifts):
                shifts[(e, d, s)] = model.NewBoolVar(f'shift_e{e}_d{d}_s{s}')

    # Constraint 1: Each shift is assigned to exactly one employee.
    for d in range(req.num_days):
        for s in range(req.num_shifts):
            model.AddExactlyOne(shifts[(e, d, s)] for e in range(req.num_employees))

    # Constraint 2: Each employee works at most one shift per day.
    for e in range(req.num_employees):
        for d in range(req.num_days):
            model.AddAtMostOne(shifts[(e, d, s)] for s in range(req.num_shifts))

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        schedule = []
        for d in range(req.num_days):
            day_schedule = {"day": d + 1, "shifts": []}
            for s in range(req.num_shifts):
                for e in range(req.num_employees):
                    if solver.Value(shifts[(e, d, s)]) == 1:
                        day_schedule["shifts"].append({"shift": s + 1, "employee_id": e + 1})
            schedule.append(day_schedule)
        return {"status": "success", "schedule": schedule}
    else:
        raise HTTPException(status_code=400, detail="No feasible schedule found with the given constraints.")
