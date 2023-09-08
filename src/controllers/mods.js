"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const user = __importStar(require("../user"));
const posts = __importStar(require("../posts"));
const flags = __importStar(require("../flags"));
const analytics = __importStar(require("../analytics"));
const plugins = __importStar(require("../plugins"));
const pagination = __importStar(require("../pagination"));
const privileges = __importStar(require("../privileges"));
const utils = __importStar(require("../utils"));
const helpers = __importStar(require("./helpers"));
const modsController = {};
modsController.flags.list = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const validFilters = ['assignee', 'state', 'reporterId', 'type', 'targetUid', 'cid', 'quick', 'page', 'perPage'];
        const validSorts = ['newest', 'oldest', 'reports', 'upvotes', 'downvotes', 'replies'];
        const results = yield Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user.isAdminOrGlobalMod(req.uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user.getModeratedCids(req.uid),
            plugins.hooks.fire('filter:flags.validateFilters', { filters: validFilters }),
            plugins.hooks.fire('filter:flags.validateSort', { sorts: validSorts }),
        ]);
        const [isAdminOrGlobalMod, moderatedCids, , { sorts }] = results;
        let [, , { filters }] = results;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (!(isAdminOrGlobalMod || !!moderatedCids.length)) {
            return helpers.notAllowed(req, res);
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (!isAdminOrGlobalMod && moderatedCids.length) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            res.locals.cids = moderatedCids.map(cid => String(cid));
        }
        // Parse query string params for filters, eliminate non-valid filters
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        filters = filters.reduce((memo, cur) => {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (req.query.hasOwnProperty(cur)) {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                if (typeof req.query[cur] === 'string' && req.query[cur].trim() !== '') {
                    // The next line calls a function in a module that has not been updated to TS yet
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    memo[cur] = req.query[cur].trim();
                    // The next line calls a function in a module that has not been updated to TS yet
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                }
                else if (Array.isArray(req.query[cur]) && req.query[cur].length) {
                    // The next line calls a function in a module that has not been updated to TS yet
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    memo[cur] = req.query[cur];
                }
            }
            return memo;
        }, {});
        let hasFilter = !!Object.keys(filters).length;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (res.locals.cids) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (!filters.cid) {
                // If mod and no cid filter, add filter for their modded categories
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                filters.cid = res.locals.cids;
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            }
            else if (Array.isArray(filters.cid)) {
                // Remove cids they do not moderate
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                filters.cid = filters.cid.filter(cid => res.locals.cids.includes(String(cid)));
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            }
            else if (!res.locals.cids.includes(String(filters.cid))) {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                filters.cid = res.locals.cids;
                hasFilter = false;
            }
        }
        // Pagination doesn't count as a filter
        if (
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (Object.keys(filters).length === 1 && filters.hasOwnProperty('page')) ||
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            (Object.keys(filters).length === 2 && filters.hasOwnProperty('page') && filters.hasOwnProperty('perPage'))) {
            hasFilter = false;
        }
        // Parse sort from query string
        let sort;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (req.query.sort) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            sort = sorts.includes(req.query.sort) ? req.query.sort : null;
        }
        if (sort === 'newest') {
            sort = undefined;
        }
        hasFilter = hasFilter || !!sort;
        const [flagsData, analyticsData, selectData] = yield Promise.all([
            flags.list({
                filters: filters,
                sort: sort,
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                uid: req.uid,
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                query: req.query,
            }),
            analytics.getDailyStatsForSet('analytics:flags', Date.now(), 30),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            helpers.getSelectedCategory(filters.cid),
        ]);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        res.render('flags/list', {
            flags: flagsData.flags,
            analytics: analyticsData,
            selectedCategory: selectData.selectedCategory,
            hasFilter: hasFilter,
            filters: filters,
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            expanded: !!(filters.assignee || filters.reporterId || filters.targetUid),
            sort: sort || 'newest',
            title: '[[pages:flags]]',
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            pagination: pagination.create(flagsData.page, flagsData.pageCount, req.query),
            breadcrumbs: helpers.buildBreadcrumbs([{ text: '[[pages:flags]]' }]),
        });
    });
};
modsController.flags.detail = function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield utils.promiseParallel({
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            isAdminOrGlobalMod: user.isAdminOrGlobalMod(req.uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            moderatedCids: user.getModeratedCids(req.uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            flagData: flags.get(req.params.flagId),
            assignees: user.getAdminsandGlobalModsandModerators(),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            privileges: Promise.all(['global', 'admin'].map((type) => __awaiter(this, void 0, void 0, function* () { return privileges[type].get(req.uid); }))),
        });
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        results.privileges = Object.assign(Object.assign({}, results.privileges[0]), results.privileges[1]);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (!results.flagData || (!(results.isAdminOrGlobalMod || !!results.moderatedCids.length))) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return next(); // 404
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        results.flagData.history = results.isAdminOrGlobalMod ? (yield flags.getHistory(req.params.flagId)) : null;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (results.flagData.type === 'user') {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            results.flagData.type_path = 'uid';
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        }
        else if (results.flagData.type === 'post') {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            results.flagData.type_path = 'post';
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        res.render('flags/detail', Object.assign(results.flagData, {
            assignees: results.assignees,
            type_bool: ['post', 'user', 'empty'].reduce((memo, cur) => {
                if (cur !== 'empty') {
                    // The next line calls a function in a module that has not been updated to TS yet
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    memo[cur] = results.flagData.type === cur && (
                    // The next line calls a function in a module that has not been updated to TS yet
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    !results.flagData.target ||
                        // The next line calls a function in a module that has not been updated to TS yet
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        !!Object.keys(results.flagData.target).length);
                }
                else {
                    // The next line calls a function in a module that has not been updated to TS yet
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    memo[cur] = !Object.keys(results.flagData.target).length;
                }
                return memo;
            }, {}),
            states: Object.fromEntries(flags._states),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            title: `[[pages:flag-details, ${req.params.flagId}]]`,
            privileges: results.privileges,
            breadcrumbs: helpers.buildBreadcrumbs([
                { text: '[[pages:flags]]', url: '/flags' },
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                { text: `[[pages:flag-details, ${req.params.flagId}]]` },
            ]),
        }));
    });
};
modsController.flags.postQueue = function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (!req.loggedIn) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return next();
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const { id } = req.params;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const { cid } = req.query;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        const page = parseInt(req.query.page, 10) || 1;
        const postsPerPage = 20;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        let postData = yield posts.getQueuedPosts({ id: id });
        const [isAdmin, isGlobalMod, moderatedCids, categoriesData] = yield Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user.isAdministrator(req.uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user.isGlobalModerator(req.uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user.getModeratedCids(req.uid),
            helpers.getSelectedCategory(cid),
        ]);
        postData = postData.filter(p => p &&
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            (!categoriesData.selectedCids.length || categoriesData.selectedCids.includes(p.category.cid)) &&
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            (isAdmin || isGlobalMod || moderatedCids.includes(Number(p.category.cid)) || req.uid === p.user.uid));
        ({ posts: postData } = yield plugins.hooks.fire('filter:post-queue.get', {
            posts: postData,
            req: req,
        }));
        const pageCount = Math.max(1, Math.ceil(postData.length / postsPerPage));
        const start = (page - 1) * postsPerPage;
        const stop = start + postsPerPage - 1;
        postData = postData.slice(start, stop + 1);
        const crumbs = [{ text: '[[pages:post-queue]]', url: id ? '/post-queue' : undefined }];
        if (id && postData.length) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const text = postData[0].data.tid ? '[[post-queue:reply]]' : '[[post-queue:topic]]';
            crumbs.push({ text: text });
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        res.render('post-queue', Object.assign(Object.assign({ title: '[[pages:post-queue]]', posts: postData, isAdmin: isAdmin, canAccept: (isAdmin || isGlobalMod || !!moderatedCids.length) }, categoriesData), { 
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            allCategoriesUrl: `post-queue${helpers.buildQueryString(req.query, 'cid', '')}`, pagination: pagination.create(page, pageCount), breadcrumbs: helpers.buildBreadcrumbs(crumbs), singlePost: !!id }));
    });
};
