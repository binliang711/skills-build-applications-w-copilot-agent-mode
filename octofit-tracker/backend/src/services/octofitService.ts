import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Activity input is required');
  const { userId, teamId, type, minutes } = input as { userId?: unknown; teamId?: unknown; type?: unknown; minutes?: unknown };
  if (typeof userId !== 'string' || typeof teamId !== 'string' || typeof type !== 'string' || type.trim() === '' ||
      typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError(400, 'A valid userId, teamId, type, and minutes are required');
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw httpError(400, 'Activity references must be valid IDs');
  }
  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Team input is required');
  const { name, mascot, members } = input as { name?: unknown; mascot?: unknown; members?: unknown };
  if (typeof name !== 'string' || name.trim() === '') throw httpError(400, 'Team name is required');
  const memberIds = Array.isArray(members) ? members.filter((id): id is string => typeof id === 'string' && mongoose.isValidObjectId(id)) : [];
  if (members !== undefined && !Array.isArray(members)) throw httpError(400, 'Team members must be an array');
  for (const memberId of memberIds) {
    if (!await User.exists({ _id: memberId })) throw httpError(404, 'Team member not found');
  }
  return Team.create({ name: name.trim(), mascot: typeof mascot === 'string' ? mascot.trim() : '', members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalByTeam = new Map(totals.map((item) => [item._id.toString(), item.totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalByTeam.get(team._id.toString()) ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recent = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = recent?.type === 'run' ? 'endurance'
    : recent?.type === 'strength' ? 'strength'
    : recent?.type === 'cycle' ? 'strength'
    : user.fitnessGoal;
  const focus = user.fitnessGoal || activityFocus;
  let workouts = await Workout.find({ focus }).lean();
  if (workouts.length === 0) workouts = await Workout.find({ focus: activityFocus }).lean();
  if (workouts.length === 0) workouts = await Workout.find().limit(3).lean();

  return workouts.map((workout) => ({
    ...workout,
    reason: `Matches ${user.fitnessGoal}${recent ? ` and recent ${recent.type} activity` : ' fitness goal'}`,
  }));
}

export { User };
