const graphql = require('graphql');
const User = require('../models/user');
const Session = require('../models/session');
const Time = require('../models/time');
const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLID, GraphQLSchema, GraphQLList, GraphQLNonNull, GraphQLBoolean, GraphQLInputObjectType } = graphql;

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    times: { type: new GraphQLList(TimeType), resolve(parent, args) {
      return Time.find({ userId: parent.id })
    } },
    pBs: { type: new GraphQLList(BestsType) }
  })
})

const TimeType = new GraphQLObjectType({
  name: 'Time',
  fields: () => ({
    id: { type: GraphQLID },
    time: { type: GraphQLString },
    dnf: { type: GraphQLBoolean },
    session: { type: SessionType, args: { session: { type: GraphQLID } }, resolve(parent, args) {
      return Session.findById(args.session)
    } },
    userId: { type: UserType, args: { userId: { type: GraphQLID } }, resolve(parent, args) {
      return User.findById(args.userId)
    } }
  })
})

const SessionType = new GraphQLObjectType({
  name: 'Session',
  fields: () => ({
    id: { type: GraphQLID },
    type: { type: GraphQLString }
  })
})

const BestsType = new GraphQLObjectType({
  name: 'Best',
  fields: () => ({
    two: { type: GraphQLString },
    three: { type: GraphQLString },
    four: { type: GraphQLString },
    five: { type: GraphQLString },
    six: { type: GraphQLString },
    seven: { type: GraphQLString }
  })
})

const BestsInputType = new GraphQLInputObjectType({
  name: 'BestsInput',
  fields: () => ({
    two: { type: GraphQLString },
    three: { type: GraphQLString },
    four: { type: GraphQLString },
    five: { type: GraphQLString },
    six: { type: GraphQLString },
    seven: { type: GraphQLString }
  })
})

const DeletedType = new GraphQLObjectType({
  name: 'Deleted',
  fields: () => ({
    acknowledged: { type: GraphQLBoolean },
    deletedCount: { type: GraphQLInt }
  })
})

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return User.findById(args.id)
      }
    },

    session: {
      type: SessionType,
      args: { search: { type: GraphQLString } },
      resolve(parent, args) {
        return Session.findOne({ type: args.search })
      }
    },

    sessions: {
      type: new GraphQLList(SessionType),
      resolve(parent, args) {
        return Session.find()
      }
    },

    sessionTimes: {
      type: new GraphQLList(TimeType),
      args: { session: { type: new GraphQLNonNull(GraphQLID) }, userId: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(parent, args) {
        return Time.find({session: args.session, userId: args.userId})
      }
    },

    bests: {
      type: UserType,
      args: { userId: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(parent, args) {
        return User.findById(args.userId)
      }
    }
  }
})

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addSession: {
      type: SessionType,
      args: { type: { type: GraphQLString } },
      resolve(parent, args) {
        let newSession = new Session({
          type: args.type
        })
        return newSession.save();
      }
    },

    addTime: {
      type: TimeType,
      args: { userId: { type: new GraphQLNonNull(GraphQLID) }, session: { type: new GraphQLNonNull(GraphQLID) }, time: { type: GraphQLString } },
      resolve(parent, args) {
        let time = new Time({
          time: args.time,
          session: args.session,
          userId: args.userId
        })
        return time.save();
      }
    },

    dnfTime: {
      type: TimeType,
      args: { timeId: { type: new GraphQLNonNull(GraphQLID) }},
      resolve(parent, args) {
        return Time.findByIdAndUpdate(args.timeId, { dnf: true }, { new: true })
      }
    },

    deleteTime: {
      type: TimeType,
      args: { timeId: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(parent, args) {
        return Time.findByIdAndDelete(args.timeId)
      }
    },

    deleteTimes: {
      type: DeletedType,
      args: { userId: { type: new GraphQLNonNull(GraphQLID) }, session: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(parent, args) {
        return Time.deleteMany({session: args.session, userId: args.userId})
      }
    },

    editPBs: {
      type: UserType,
      args: { userId: { type: new GraphQLNonNull(GraphQLID) }, data: { type: BestsInputType } },
      resolve(parent, args) {
        User.findById(args.userId, (err, user) => {
          user.pBs = args.data
          return user.save()
        })
      }
    }
  }
})

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
})
