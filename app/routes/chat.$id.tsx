import type { Route } from './+types/chat.$id';
import { default as IndexRoute } from './_index';

export async function loader(args: Route.LoaderArgs) {
  return { id: args.params.id };
}

export default IndexRoute;
