// utils
import { endpoints, addCategory, postFetcher } from 'src/utils/axios';

export async function postAddCategory({
  user,
  categoryName,
  categoryDescription,
  categoryColor,
  categoryDisplayName,
}) {
  const URL = user.email &&
    categoryName &&
    categoryColor &&
    categoryDisplayName && [
      endpoints.users.addcategory,
      {
        userEmail: user.email,
        categoryName,
        categoryDescription,
        categoryColor,
        categoryDisplayName,
      },
    ];

  let status = '';

  if (URL != null) {
    status = await addCategory(URL);
    console.log(status);
  } else {
    status = null;
  }

  return status;
}

export async function postUpdateProfileCategories({ userEmail, categories }) {
  console.log(userEmail, categories);
  const URL =
    userEmail && categories
      ? [
          endpoints.users.updatecategories,
          {
            userEmail,
            categories,
          },
        ]
      : null;
  let response = '';
  console.log('URL', URL);

  if (URL != null) {
    response = await postFetcher(URL);
    console.log(response);
  } else {
    response = null;
  }

  return response;
}
